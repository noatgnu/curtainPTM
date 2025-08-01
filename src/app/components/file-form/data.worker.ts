/// <reference lib="webworker" />

import {DataFrame, fromCSV, Series, IDataFrame} from "data-forge";

addEventListener('message', (data: MessageEvent<any>) => {
  console.log(data.data)
  switch (data.data.task) {
    case "processDifferentialFile":
      postMessage({type: "progress", value: 100, text: "Processing differential data..."})
      let df: IDataFrame = fromCSV(data.data.differential)
      console.log(data.data.differentialForm)
      if (!data.data.differentialForm._comparison || data.data.differentialForm._comparison === "" || data.data.differentialForm._comparison === "CurtainSetComparison") {
        data.data.differentialForm._comparison = "CurtainSetComparison"
        data.data.differentialForm._comparisonSelect = "1"

        df = df.withSeries("CurtainSetComparison", new Series(Array(df.count()).fill("1"))).bake()
      }

      if (data.data.differentialForm._comparisonSelect === "" || data.data.differentialForm._comparisonSelect === undefined) {
        if (df.getColumnNames().includes(data.data.differentialForm._comparison)) {
          data.data.differentialForm._comparisonSelect = df.first()[data.data.differentialForm._comparison]
        } else {
          data.data.differentialForm._comparison = "CurtainSetComparison"
          data.data.differentialForm._comparisonSelect = "1"

          df = df.withSeries("CurtainSetComparison", new Series(Array(df.count()).fill("1"))).bake()
        }

      }
      const store: any[] = df.toArray().map((r: any) => {
        r[data.data.differentialForm._position] = parseArrayField(r[data.data.differentialForm._position], 'number')
        r[data.data.differentialForm._positionPeptide] = parseArrayField(r[data.data.differentialForm._positionPeptide], 'number')
        r[data.data.differentialForm._foldChange] = Number(r[data.data.differentialForm._foldChange])
        r[data.data.differentialForm._score] = Number(r[data.data.differentialForm._score])
        r[data.data.differentialForm._significant] = Number(r[data.data.differentialForm._significant])
        if (data.data.differentialForm._transformFC) {
          if (r[data.data.differentialForm._foldChange] > 0) {
            r[data.data.differentialForm._foldChange] = Math.log2(r[data.data.differentialForm._foldChange])
          } else if (r[data.data.differentialForm._foldChange] < 0) {
            r[data.data.differentialForm._foldChange] = -Math.log2(Math.abs(r[data.data.differentialForm._foldChange]))
          } else {
            r[data.data.differentialForm._foldChange] = 0
          }
        }
        if (data.data.differentialForm._reverseFoldChange) {
          r[data.data.differentialForm._foldChange] = -r[data.data.differentialForm._foldChange]
        }
        if (data.data.differentialForm._significant) {
          r[data.data.differentialForm._significant] = Number(r[data.data.differentialForm._significant])
        }
        if (data.data.differentialForm._transformSignificant) {
          r[data.data.differentialForm._significant] = -Math.log10(r[data.data.differentialForm._significant])
        }
        r[data.data.differentialForm._peptideSequence] = parseArrayField(r[data.data.differentialForm._peptideSequence], 'string', true)
        if (data.data.differentialForm._sequence) {
          r[data.data.differentialForm._sequence] = parseArrayField(r[data.data.differentialForm._sequence], 'string')
        }
        return r
      })



      // passing data back to main thread in chunks of 100 items each to avoid memory issues
      /*const chunkSize = 100
      const chunkNumber = Math.ceil(df.count() / chunkSize)
      for (let i = 0; i < chunkNumber; i++) {
        postMessage({type: "progress", value: i*100/chunkNumber, text: "Processing differential data..."})
        postMessage({type: "resultDifferential", differential: df.skip(i*chunkSize).take(chunkSize).toArray()})
      }*/
      postMessage({type: "progress", value: 100, text: "Finished processing differential data"})
      // @ts-ignore
      const result = {type: "resultDifferential", differential: JSON.stringify(store), differentialForm: data.data.differentialForm}
      postMessage(result)

      break
  case "processRawFile":
    postMessage({type: "progress", value: 100, text: "Processing primary data"})
    let rawDF: IDataFrame = fromCSV(data.data.raw)
    const totalSampleNumber = data.data.rawForm._samples.length
    let sampleNumber = 0
    const conditions: string[] = []
    let colorPosition = 0
    const colorMap: any = {}
    const conditionOrder = data.data.settings.conditionOrder.slice()
    let samples: string[] = []
    samples = data.data.rawForm._samples.slice()
    const sampleMap: any = {}
    for (const s of samples) {
      const condition_replicate = s.split(".")
      const replicate = condition_replicate[condition_replicate.length-1]
      const condition = condition_replicate.slice(0, condition_replicate.length-1).join(".")
      if (!conditions.includes(condition)) {
        conditions.push(condition)
        if (colorPosition >= data.data.settings.defaultColorList.length) {
          colorPosition = 0
        }
        colorMap[condition] = data.data.settings.defaultColorList[colorPosition]
        colorPosition ++
      }
      if (!data.data.settings.sampleOrder[condition]) {
        data.data.settings.sampleOrder[condition] = []
      }
      if (!data.data.settings.sampleOrder[condition].includes(s)) {
        data.data.settings.sampleOrder[condition].push(s)
      }

      if (!(s in data.data.settings.sampleVisible)) {
        data.data.settings.sampleVisible[s] = true
      }
      sampleMap[s] = {replicate: replicate, condition: condition, name: s}
    }

    if (Object.keys(data.data.settings.sampleMap).length === 0) {
      data.data.settings.sampleMap = sampleMap
    }
    for (const s in data.data.settings.sampleVisible) {
      if (!(s in sampleMap)) {
        delete data.data.settings.sampleVisible[s]
      }
    }
    for (const s in colorMap) {
      if (!(s in data.data.settings.colorMap)) {
        data.data.settings.colorMap[s] = colorMap[s]
      }
    }
    for (const s in data.data.settings.sampleMap) {
      if (!(s in sampleMap)) {
        delete data.data.settings.sampleMap[s]
      }
    }

    if (data.data.settings.conditionOrder.length === 0) {
      data.data.settings.conditionOrder = conditions.slice()
    } else {
      //let conditionOrder = conditions.slice()
      /*for (const c of data.data.settings.conditionOrder) {
        if (!conditionOrder.includes(c)) {
          data.data.settings.conditionOrder = data.data.settings.conditionOrder.filter((cc: string) => cc !== c)
        }
      }
      console.log(conditionOrder)
      for (const c of conditionOrder) {
        if (!data.data.settings.conditionOrder.includes(c)) {
          data.data.settings.conditionOrder.push(c)
        }
      }
      console.log(data.data.settings.conditionOrder)
    }*/
      const conditionO: string[] = []
      for (const c of conditionOrder) {

        if (!conditions.includes(c)) {

        } else {
          conditionO.push(c)
        }
      }
      for (const c of conditions) {
        if (!conditionO.includes(c)) {
          conditionO.push(c)
        }
      }
      data.data.settings.conditionOrder = conditionO
    }
    const storeRaw = rawDF.toArray().map((r: any) => {
      for (const s of samples) {
        r[s] = Number(r[s])
      }
      return r
    })

    // @ts-ignore
    postMessage({type: "resultRaw", raw: JSON.stringify(storeRaw), settings: data.data.settings, conditions: conditions})
  }
});

function convertToNumber(arr: string[]) {
  const newCol = arr.map(Number)
  return newCol
}

function log2Convert(arr: number[]) {
  const newCol = arr.map(a => log2Stuff(a))
  return newCol
}

function log2Stuff(data: number) {
  if (data > 0) {
    return Math.log2(data)
  } else if (data < 0) {
    return -Math.log2(Math.abs(data))
  } else {
    return 0
  }
}

function log10Convert(arr: number[]) {
  const newCol = arr.map(a => -Math.log10(a))
  return newCol
}
function parseSequence(df: IDataFrame, sequenceColumnName: string) {
  return df.getSeries(sequenceColumnName).bake().toArray().map(v => {
    let count = 0
    let seq = ""
    for (const a of v) {
      if (["(", "[", "{"].includes(a)) {
        count = count + 1
      }
      if (count === 0) {
        seq = seq + a
      }
      if ([")", "]", "}"].includes(a)) {
        count = count - 1
      }
    }
    return seq
  })
}

function parseSequenceSingle(v: string) {
  let count = 0
  let seq = ""
  for (const a of v) {
    if (["(", "[", "{"].includes(a)) {
      count = count + 1
    }
    if (count === 0) {
      seq = seq + a
    }
    if ([")", "]", "}"].includes(a)) {
      count = count - 1
    }
  }
  return seq
}

function parseArrayField(value: string, type: 'number' | 'string', cleanSequence: boolean = false): any {
  if (!value || value === '') {
    return type === 'number' ? [] : []
  }
  
  const parts = value.split(';').map(part => part.trim()).filter(part => part !== '')
  
  if (parts.length === 1) {
    if (type === 'number') {
      const num = Number(parts[0])
      return isNaN(num) ? [parts[0]] : num
    } else {
      return cleanSequence ? parseSequenceSingle(parts[0]) : parts[0]
    }
  }
  
  if (type === 'number') {
    return parts.map(part => {
      const num = Number(part)
      return isNaN(num) ? part : num
    })
  } else {
    return cleanSequence ? parts.map(part => parseSequenceSingle(part)) : parts
  }
}
