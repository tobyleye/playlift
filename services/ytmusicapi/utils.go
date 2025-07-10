package ytmusicapi

import (
	"encoding/json"
	"fmt"
	"os"
)

// given an object of type interface, and an array of keys,
// return the value of the object at the location specified by the keys
func ReadValue(object interface{}, arrayOfkeys []interface{}) interface{} {

	if len(arrayOfkeys) == 0 {
		return object
	}

	key := arrayOfkeys[0]

	switch key := key.(type) {
	case string:
		if obj, ok := object.(map[string]interface{}); ok {
			val := obj[key]
			return ReadValue(val, arrayOfkeys[1:])
		} else {
			return nil
		}
	case int:
		index := key
		if arr, ok := object.([]interface{}); ok {
			if len(arr) > 0 && len(arr) >= index {
				val := arr[index]
				return ReadValue(val, arrayOfkeys[1:])

			}
		}
		return nil

	default:
		return nil
	}
}

func ReadValueString(object interface{}, arrayOfkeys []interface{}) string {
	value, _ := ReadValue(object, arrayOfkeys).(string)
	return value
}

func SaveJson(data interface{}, filename string) error {
	res, _ := json.MarshalIndent(data, "", "  ")
	filename = fmt.Sprintf("./samples/%s.json", filename)
	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()
	f.Write(res)
	return nil
}
