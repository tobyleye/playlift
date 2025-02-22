package types

type SearchQuery struct {
	Title   string   `json:"title"`
	Artists []string `json:"artists"`
	Type    string   `json:"type"`
}
