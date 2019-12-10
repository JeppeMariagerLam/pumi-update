# pumi update script
Updates the data stored in https://github.com/dwilkie/pumi based on web scraping of http://db.ncdd.gov.kh/gazetteer/view/index.castle.

Not the most beautiful code in the world, but it works!

## Usage

```
docker-compose run pumi-update
```

Once it's done (takes about 15-20 mins), you will have 4 Yaml files in the data directory, which contain the province, district, commune and village codes and names (in both English and Khmer) for all of Cambodia.
