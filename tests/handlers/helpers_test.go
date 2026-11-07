package test_handlers

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/tobyleye/playlift/handlers"
)

func Test_ConversionLinkParser(t *testing.T) {

	testcases := []struct {
		input  string
		result handlers.ConversionLink
		err    error
	}{
		{
			input: "https://open.spotify.com/playlist/37i9dQZEVXcHIazira00Nn?si=1b78314e7ddb4eb8",
			result: handlers.ConversionLink{
				Platform: handlers.SPOTIFY,
				Link:     "https://open.spotify.com/playlist/37i9dQZEVXcHIazira00Nn?si=1b78314e7ddb4eb8",
				Type:     "playlist",
				ID:       "37i9dQZEVXcHIazira00Nn",
			},
			err: nil,
		},
		{
			input:  "",
			result: handlers.ConversionLink{},
			err:    errors.New("link is invalid"),
		},
	}

	for _, each := range testcases {
		result, err := handlers.ParseConversionLink(each.input)
		assert.Equal(t, each.result, result)
		assert.Equal(t, each.err, err)
	}

}
