'use strict'
const request = require('request-promise')
const cheerio = require('cheerio')
const sleep = require('sleep')
const fs = require('fs')
const bluebird = require('bluebird')

let data = {}

request.get('http://db.ncdd.gov.kh/gazetteer/view/index.castle')
  .then(response => {
    let $ = cheerio.load(response)
    let communeTotal = $('[onclick^="loadVillage"]').length
    let communeCount = 0
    return bluebird.mapSeries($('[onclick^="loadVillage"]').toArray(), (element) => {
      let id = element.attribs.onclick.replace(/[^\d]/g, '')
      let options = {
        method: "POST",
        uri: 'http://db.ncdd.gov.kh/gazetteer/view/commune.castle',
        formData: {
          cm: id
        }
      }
      console.log(`Sending request for commune ${JSON.stringify(options)}`)
      return request(options)
        .then(response => {
          let $ = cheerio.load(response)
          let code = $('#summary table tr:first-of-type td:nth-of-type(2)').text()
          if(code.length == 5)
            code = '0'+code
          let fullname_kh = $('#summary table tr:nth-of-type(2) td:nth-of-type(2)').text()
          let fullname_en = $('#summary table tr:nth-of-type(3) td:nth-of-type(2)').text()

          if(!data[code.substr(0, 2)])
            data[code.substr(0, 2)] = {
              name_en: fullname_en.split(" / ")[0].replace(' Province', ''),
              name_km: fullname_kh.split(" / ")[0]
            }

          if(!data[code.substr(0, 2)][code.substr(2, 2)])
            data[code.substr(0, 2)][code.substr(2, 2)] = {
              name_en: fullname_en.split(" / ")[1].replace(' District', ''),
              name_km: fullname_kh.split(" / ")[1]
          }

          if(!data[code.substr(0, 2)][code.substr(2, 2)][code.substr(4, 2)])
            data[code.substr(0, 2)][code.substr(2, 2)][code.substr(4, 2)] = {
              name_en: fullname_en.split(" / ")[2].replace(' Commune', ''),
              name_km: fullname_kh.split(" / ")[2]
            }

          $('#dl_list table tr').each((i, tr) => {
            let $ = cheerio.load(tr)
            data[code.substr(0, 2)][code.substr(2, 2)][code.substr(4, 2)][$('td:nth-of-type(1)').text()] = {
              name_en: $('td:nth-of-type(3)').text(), name_km: $('td:nth-of-type(2)').text()
            }
          })
          communeCount++
          console.log(`Done ${communeCount} of ${communeTotal}`)
          fs.writeFileSync('villages.json', JSON.stringify(data))
        })
        .delay(250)
      })
  })
  .then(() => {
    fs.writeFileSync('data/provinces.yml', "---\nprovinces:")
    fs.writeFileSync('data/districts.yml', "---\ndistricts:")
    fs.writeFileSync('data/communes.yml', "---\ncommunes:")
    fs.writeFileSync('data/villages.yml', "---\nvillages:")

    let sortById = (a, b) => {
      if (parseInt(a.id) < parseInt(b.id)) {
        return -1;
      }
      if (parseInt(a.id) > parseInt(b.id)) {
        return 1;
      }
      return 0
    }

    fs.readFile('villages.json', (err, data) => {
      if (err) throw err;
      data = JSON.parse(data)
      let provinces = []
      let districts = []
      let communes = []
      let villages = []
      // Read provinces
      Object.keys(data).forEach((i, elm) => {
        provinces.push({id: i, name_en: data[i].name_en.replace(' Capital', ''), name_km: data[i].name_km.replace('ខេត្ត', '').replace('រាជធានី', '')})
        // Read districts
        Object.keys(data[i]).forEach((e, elm) => {
          if(e !== 'name_km' && e !== 'name_en') {
            districts.push({id: i + '' + e, name_en: data[i][e].name_en.replace(' Municipality', ''), name_km: data[i][e].name_km.replace('ស្រុក', '').replace('ក្រុង', '')})
            Object.keys(data[i][e]).forEach((o, elm) => {
              if(o !== 'name_km' && o !== 'name_en') {
                communes.push({id: i + '' + e + o, name_en: data[i][e][o].name_en.replace('Sangkat', ''), name_km: data[i][e][o].name_km.replace('ឃុំ', '').replace('សង្កាត់', '')})
                Object.keys(data[i][e][o]).forEach((u, elm) => {
                  if(u !== '' && u !== 'name_km' && u !== 'name_en') {
                    villages.push({id: u, name_en: data[i][e][o][u].name_en, name_km: data[i][e][o][u].name_km})
                  }
                })
              }
            })
          }
        })
      })
      provinces.sort(sortById)
      districts.sort(sortById)
      communes.sort(sortById)
      villages.sort(sortById)

      provinces.forEach(e => {
        fs.appendFileSync('data/provinces.yml', `\n  '${e.id}':\n    name_en: ${e.name_en}\n    name_km: ${e.name_km}`)
      })
      console.log('provinces done')

      districts.forEach(e => {
        fs.appendFileSync('data/districts.yml', `\n  '${e.id}':\n    name_en: ${e.name_en}\n    name_km: ${e.name_km}`)
      })
      console.log('districts done')

      communes.forEach(e => {
        fs.appendFileSync('data/communes.yml', `\n  '${e.id}':\n    name_en: ${e.name_en}\n    name_km: ${e.name_km}`)
      })
      console.log('communes done')

      villages.forEach(e => {
        fs.appendFileSync('data/villages.yml', `\n  '${e.id}':\n    name_en: ${e.name_en}\n    name_km: ${e.name_km}`)
      })
      console.log('villages done')
    })
  })
