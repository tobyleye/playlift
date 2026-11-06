import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import api from "@/api/api";
import {
  SAMPLE_CONVERSION_ID,
  samplePlaylist,
  sampleTrackResults,
} from "./sample-data";
import {
  GuestConversionRecord,
  GuestConversionStatus,
  TrackConversionResults,
} from "./types";

export { SAMPLE_CONVERSION_ID };

const POLL_INTERVAL_MS = 1500;
/** a run that's gone on this long is checked less often, not abandoned */
const SLOW_AFTER_MS = 2 * 60 * 1000;
const SLOW_POLL_INTERVAL_MS = 5000;
const MAX_BACKOFF_MS = 15000;
/** consecutive failed requests before the page says it's reconnecting */
const RECONNECTING_AFTER_FAILURES = 3;
const SAMPLE_STEP_MS = 300;

/**
 * Follows a guest conversion until it finishes or every preview track has a
 * result. Request failures never end the run: it backs off and keeps going,
 * because the conversion carries on server-side either way.
 */
export default function useConversionStatus(
  conversionId: string,
  /** the rows on screen; may only be known after the first response */
  previewTrackIds: string[] | null,
) {
  const [conversion, setConversion] = useState<GuestConversionRecord | null>(
    null,
  );
  const [status, setStatus] = useState<GuestConversionStatus>("");
  const [trackResults, setTrackResults] = useState<TrackConversionResults>({});
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  // bumping this restarts the polling loop, e.g. after a retry
  const [pollKey, setPollKey] = useState(0);

  const previewIds = useRef(previewTrackIds);
  previewIds.current = previewTrackIds;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (conversionId === SAMPLE_CONVERSION_ID) {
      // finish tracks out of order, the way parallel workers do
      const pending = samplePlaylist.tracks
        .map((track) => track.id)
        .sort(() => Math.random() - 0.5);

      const tick = () => {
        if (cancelled) return;
        const trackId = pending.shift();
        if (!trackId) {
          setStatus("completed");
          return;
        }
        setTrackResults((current) => ({
          ...current,
          [trackId]: sampleTrackResults[trackId],
        }));
        timer = setTimeout(tick, SAMPLE_STEP_MS);
      };
      timer = setTimeout(tick, SAMPLE_STEP_MS * 3);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const startedAt = Date.now();
    let failures = 0;

    const nextDelay = () => {
      if (failures > 0) {
        return Math.min(POLL_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS);
      }
      return Date.now() - startedAt > SLOW_AFTER_MS
        ? SLOW_POLL_INTERVAL_MS
        : POLL_INTERVAL_MS;
    };

    const tick = async () => {
      try {
        const response = await api.guestConversionStatus(conversionId);
        if (cancelled) return;
        failures = 0;
        setIsReconnecting(false);

        // the cache holds live progress; the db row only fills in at the end
        const results = {
          ...response.conversion.result,
          ...response.state?.result,
        };
        const nextStatus =
          response.state?.status || response.conversion.status;
        setConversion(response.conversion);
        setTrackResults(results);
        setStatus(nextStatus);

        const ids =
          previewIds.current ??
          response.conversion.playlist_tracks?.map((track) => track.id);
        const previewDone =
          !!ids?.length && ids.every((trackId) => results[trackId]);
        const isFinal = nextStatus === "completed" || nextStatus === "failed";
        if (isFinal || previewDone) return;
      } catch (error) {
        if (cancelled) return;
        if (isAxiosError(error) && error.response?.status === 404) {
          setNotFound(true);
          return;
        }
        console.error("error fetching guest conversion status", error);
        failures += 1;
        if (failures >= RECONNECTING_AFTER_FAILURES) setIsReconnecting(true);
      }

      setIsTakingLong(Date.now() - startedAt > SLOW_AFTER_MS);
      timer = setTimeout(tick, nextDelay());
    };

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversionId, pollKey]);

  /** re-runs the same conversion; tracks that already converted are kept */
  const retry = useCallback(async () => {
    setIsRetrying(true);
    try {
      if (conversionId !== SAMPLE_CONVERSION_ID) {
        await api.guestRetryConversion(conversionId);
      } else {
        setTrackResults({});
      }
      setStatus("pending");
      setIsTakingLong(false);
      setPollKey((key) => key + 1);
      return true;
    } catch (error) {
      console.error("error retrying guest conversion", error);
      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [conversionId]);

  return {
    conversion,
    status,
    trackResults,
    isReconnecting,
    isTakingLong,
    notFound,
    isRetrying,
    retry,
  };
}
