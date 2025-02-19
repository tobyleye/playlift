package spotify_service

import (
	"fmt"
	"net/http"
)

func PlainSearchSpotify(query string) (interface{}, error) {
	url := `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchTracks&variables={"includePreReleases":false,"numberOfTopResults":20,"isGatedPodcastsEnabled":false,"searchTerm":"first thing smo","offset":0,"limit":20,"includeAudiobooks":false}&extensions={"persistedQuery":{"version":1,"sha256Hash":"220d098228a4eaf216b39e8c147865244959c4cc6fd82d394d88afda0b710929"}}`
	req, _ := http.NewRequest("GET", url, nil)
	auth := "BQBTVLbeh1cs0D_8dLw5v-wBMwfzLwYHIKc9KnaGEfG0CFGeIXA9sT73L2joRKq4nfQYM0lsg6OG_62RAkXJePGlU1ZD0_RZc461EHcZObyGFoMPzQT5VLZ0_LzViLodnC4EzmNmNN7bhseyIJxSU6bvXHafsWyTb_4E-b2ji3lhyfHLF-XXFPOr_YbdxdVr0-lZbTnVZJ1dR453rSOLeQFmQF2PiWRB6Sz6u4w4QUS3VOMoHEgXpxpZS9fdnAlPwhb-32zsjSWotlyZx4e2CUuMIQjwPb554anOkUZIkVvWXlk80j1Ya3bOc7usqs2tBA64Ly3y9rwLtBG1"
	req.Header.Add("Authorization", "Bearer "+auth)
	resp, err := http.DefaultClient.Do(req)
	fmt.Println(resp)
	fmt.Println(err)

	return nil, nil
}
