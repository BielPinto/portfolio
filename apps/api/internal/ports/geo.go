package ports

import "context"

// GeoResolver maps an IP to a coarse location (e.g. country code) without blocking HTTP.
type GeoResolver interface {
	ResolveCountryCode(ctx context.Context, ip string) (countryCode string, err error)
}
