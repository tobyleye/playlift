package main

import (
	"context"
	"fmt"
	"net/http"
	"os/exec"

	"github.com/tobyleye/playlift/config"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func main() {
	srvPort := "7777"

	config.GetGoogleOauthConfig()
	oauthConfig := &oauth2.Config{
		ClientID:     config.GOOGLE_CLIENT_ID,
		ClientSecret: config.GOOGLE_CLIENT_SECRET,
		Endpoint:     google.Endpoint,
		RedirectURL:  "http://localhost:" + srvPort + "/admin/login-callback",
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
	}
	url := oauthConfig.AuthCodeURL("")

	cmd := exec.Command("open", url)
	_, err := cmd.Output()
	if err != nil {
		fmt.Printf("couldn't open the browser. open the browser and visit %s\n", url)
	}

	done := make(chan bool)

	http.HandleFunc("/admin/login-callback", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("running login callback..")
		queries := r.URL.Query()
		code := queries.Get("code")
		token, err := oauthConfig.Exchange(context.TODO(), code)

		if err != nil {
			w.WriteHeader(400)
			fmt.Fprintf(w, `<div>
				<p>we couldn't authenticate you sorry %s</p>
			</div>`, err)
			return
		}

		w.WriteHeader(200)
		fmt.Fprintf(w, `<div>
				<p>congratulations</p>
				<p>Your token are generated</p>
			</div>`)

		fmt.Println("token..", token)
		done <- true
	})

	go http.ListenAndServe(fmt.Sprintf(":%s", srvPort), nil)

	fmt.Println("waiting for user to finish oauth flow")

	<-done
}
