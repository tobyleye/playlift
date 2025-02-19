package ytmusicapi

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/carlmjohnson/requests"
)

func FetchPlaylistWithRequest(playlistId string) {
	browseId := playlistId

	if !strings.HasPrefix(browseId, "VL") {
		browseId = "VL" + browseId
	}
	fmt.Print(browseId)
	url := "https://music.youtube.com/youtubei/v1/browse?alt=json"
	body := map[string]interface{}{
		"browseId": browseId,
		"context": map[string]interface{}{
			"client": map[string]interface{}{
				"clientName":    "WEB_REMIX",
				"clientVersion": fmt.Sprintf("1.%s.01.00", time.Now().UTC().Format("20060102")),
			},
			"user": map[string]interface{}{},
		},
	}

	var res interface{}
	ctx := context.Background()

	err := requests.
		URL(url).
		BodyJSON(&body).
		ToJSON(&res).
		Fetch(ctx)

	if err == nil {
		f, _ := os.Create("./playlist.json")
		json.NewEncoder(f).Encode(res)
	}
	fmt.Println("error --", err)
	fmt.Println("res --", res)
}
