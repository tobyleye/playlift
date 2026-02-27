package migrations

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddMigrationContext(upAddAndBackfillCreatedPlaylistId, downAddAndBackfillCreatedPlaylistId)
}

func upAddAndBackfillCreatedPlaylistId(ctx context.Context, tx *sql.Tx) error {
	// 1: create playlist id column
	_, err := tx.ExecContext(ctx, `
			ALTER TABLE playlist_conversions
			ADD COLUMN created_playlist_id VARCHAR(255) DEFAULT '' AFTER created_playlist_link
		`)
	if err != nil {
		return fmt.Errorf("add created_playlist_id column: %w", err)
	}

	// 2. Backfill from created_playlist_link for Spotify destinations
	_, err = tx.ExecContext(ctx, `
		UPDATE playlist_conversions
		SET created_playlist_id = SUBSTRING_INDEX(
			SUBSTRING_INDEX(created_playlist_link, '/playlist/', -1),
			'?', 1
		)
		WHERE created_playlist_link != ''
		  AND created_playlist_link IS NOT NULL
		  AND (created_playlist_id IS NULL OR created_playlist_id = '')
		  AND destination_platform = 'spotify'
	`)
	if err != nil {
		return fmt.Errorf("backfill spotify created_playlist_id: %w", err)
	}

	// 3. Backfill from created_playlist_link for YouTube Music destinations
	_, err = tx.ExecContext(ctx, `
		UPDATE playlist_conversions
		SET created_playlist_id = SUBSTRING_INDEX(
			SUBSTRING_INDEX(created_playlist_link, 'list=', -1),
			'&', 1
		)
		WHERE created_playlist_link != ''
		  AND created_playlist_link IS NOT NULL
		  AND (created_playlist_id IS NULL OR created_playlist_id = '')
		  AND destination_platform = 'youtube_music'
	`)
	if err != nil {
		return fmt.Errorf("backfill youtube created_playlist_id: %w", err)
	}

	return nil
}

func downAddAndBackfillCreatedPlaylistId(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `
		ALTER TABLE playlist_conversions DROP COLUMN created_playlist_id
	`)
	return err
}
