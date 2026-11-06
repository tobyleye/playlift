package utils

func Min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func Map(list []interface{}, f func(e interface{}, i int) interface{}) []interface{} {
	r := []interface{}{}
	for i, e := range list {
		r = append(r, f(e, i))
	}
	return r
}
