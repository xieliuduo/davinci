/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import { IChartProps } from '../../../components/Chart'
import { EChartOption } from 'echarts'
import {
  decodeMetricName,
  getTextWidth,
  getSizeRate
} from '../../../components/util'
import {
  getLegendOption,
  getLabelOption,
  getSymbolSize
} from '../util'
import {
  getProvinceParent,
  getProvinceName,
  getCityArea,
  getProvinceArea,
  getVisualMapOptions
} from './utils'
import {getMapOption} from './type/map'
import {getScatterOption} from './type/scatter'
import {getHeatmapOption} from './type/heatmap'
import {getLinesOption} from './type/lines'
import {
  safeAddition
} from 'utils/util'


import { getFormattedValue } from '../../../components/Config/Format'

export default function(chartProps: IChartProps, drillOptions) {

  const {
    chartStyles,
    data,
    cols,
    metrics,
    model
  } = chartProps
  console.log('chartProps')
  console.log(chartProps)
  const {
    label,
    spec
  } = chartStyles

  const {
    labelColor,
    labelFontFamily,
    labelFontSize,
    labelPosition,
    showLabel
  } = label

  const {
    layerType,
    roam,
    linesSpeed,
    symbolType
  } = spec

  const{mapName} = drillOptions
  const tooltip: EChartOption.Tooltip = {
    trigger: 'item',
    formatter: (params: EChartOption.Tooltip.Format) => {

       const { name, data, color } = params

       const tooltipLabels = []
       if (color) {
        tooltipLabels.push(`<span class="widget-tooltip-circle" style="background: ${color}"></span>`)
      }
       tooltipLabels.push(name)
       if (data) {
        tooltipLabels.push(': ')
        tooltipLabels.push(getFormattedValue(data.value[2], metrics[0].format))
      }
       return tooltipLabels.join('')
    }
  }
  const geo = {
          map: mapName,
          itemStyle: {
            normal: {
              areaColor: '#cccccc',
              borderColor: '#ffffff',
              borderWidth: 1
            },
            emphasis: {
              areaColor: '#bbbbbb'
            }
          },
          roam
        }
  const baseOption = {
    tooltip,
    geo
  }
  let options = {}
  switch (layerType) {
      case 'map':
        options = getMapOption(chartProps, drillOptions, baseOption)
        break
      case 'scatter':
        options = getScatterOption(chartProps, drillOptions, baseOption)
        break
      case 'heatmap':
        options = getHeatmapOption(chartProps, drillOptions, baseOption)
        break
      case 'lines':
        options = getLinesOption(chartProps, drillOptions, baseOption)
        break
      default:
        throw Error('Unable to find layerType')
        break
    }
  return options


  const labelOption = {
    label: {
      normal: {
        formatter: '{b}',
        position: labelPosition,
        show: showLabel,
        color: labelColor,
        fontFamily: labelFontFamily,
        fontSize: labelFontSize
      }
    }
  }

  const labelOptionLines = {
    label: getLabelOption('lines', label, metrics, true)
  }

  let metricOptions


  const dataTree = {}

  const agg = metrics[0].agg
  const metricName = decodeMetricName(metrics[0].name)

  let min = -Infinity
  let max = Infinity
  if (data.length) {
    min = Math.min(max, data[0][`${agg}(${metricName})`])
    max = Math.min(min, data[0][`${agg}(${metricName})`])
  }


  data.forEach((record) => {
    let areaVal
    const group = []

    const value = record[`${agg}(${metricName})`]
    min = Math.min(min, value)
    max = Math.max(max, value)

    cols.forEach((col) => {
      const { visualType } = model[col.name]
      if (visualType === 'geoProvince') {
        areaVal = record[col.name]
        const area = getProvinceArea(areaVal)
        const provinceName = getProvinceName(areaVal)
        if (area) {
          if (!dataTree[provinceName]) {
            dataTree[provinceName] = {
              lon: area.lon,
              lat: area.lat,
              value,
              children: {}
            }
          }
        }
      } else if (visualType === 'geoCity') {
        areaVal = record[col.name]
        const area = getCityArea(areaVal)
        if (area) {
          if (layerType === 'map') {
            const provinceParent = getProvinceParent(area)
            const parentName = getProvinceName(provinceParent.name)
            if (!dataTree[parentName]) {
              dataTree[parentName] = {
                lon: area.lon,
                lat: area.lat,
                value: 0,
                children: {}
              }
            }
            // FIXBUG handle agg
            // dataTree[parentName].value=getParentValue()
            dataTree[parentName].value += value
          } else {
            if (!dataTree[areaVal]) {
              dataTree[areaVal] = {
                lon: area.lon,
                lat: area.lat,
                value,
                children: {}
              }
            }
          }
        }
      }
    })
  })
  console.log(dataTree)
  console.log('dataTree')
  // series 数据项
  const metricArr = []


  const sizeRate = getSizeRate(min, max)

  const optionsType = layerType === 'scatter' ? {} : {
    blurSize: 40
  }

  let serieObj
  switch (layerType) {
    case 'map':
      serieObj = {
        name: '地图',
        type: 'map',
        mapType: mapName,
        roam,
        data: Object.keys(dataTree).map((key, index) => {
          const { lon, lat, value } = dataTree[key]
          return {
            name: key,
            value: [lon, lat, value]
          }
        }),
        ...labelOption
      }
      break
    case 'scatter':
      serieObj = {
        name: '气泡图',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: Object.keys(dataTree).map((key, index) => {
          const { lon, lat, value } = dataTree[key]
          return {
            name: key,
            value: [lon, lat, value],
            symbolSize: getSymbolSize(sizeRate, value) / 2
          }
        }),
        ...labelOption,
        ...optionsType
      }
      break
    case 'heatmap':
      serieObj = {
        name: '热力图',
        type: 'heatmap',
        coordinateSystem: 'geo',
        data: Object.keys(dataTree).map((key, index) => {
          const { lon, lat, value } = dataTree[key]
          return {
            name: key,
            value: [lon, lat, value],
            symbolSize: getSymbolSize(sizeRate, value) / 2
          }
        }),
        ...labelOption,
        ...optionsType
      }
      break
  }

  metricArr.push(serieObj)
  metricOptions = {
    series: metricArr
  }



  const getGeoCity = cols.filter((c) => model[c.name].visualType === 'geoCity')
  const getGeoProvince = cols.filter((c) => model[c.name].visualType === 'geoProvince')
  const linesSeries = []
  const legendData = []
  let effectScatterType
  let linesType
  data.forEach((d, index) => {
    let linesSeriesData = []
    let scatterData = []
    const value = d[`${agg}(${metricName})`]

    if (getGeoCity.length > 1 && d[getGeoCity[0].name] && d[getGeoCity[1].name]) {
      const fromCityInfo = getCityArea(d[getGeoCity[0].name])
      const toCityInfo = getCityArea(d[getGeoCity[1].name])

      if (fromCityInfo && toCityInfo) {
        legendData.push(d[getGeoCity[0].name])
        linesSeriesData = [{
          fromName: d[getGeoCity[0].name],
          toName: d[getGeoCity[1].name],
          coords: [[fromCityInfo.lon, fromCityInfo.lat], [toCityInfo.lon, toCityInfo.lat]]
        }]
        scatterData = [{
          name: d[getGeoCity[1].name],
          value: [toCityInfo.lon, toCityInfo.lat, value]
        }]
      }
    } else if (getGeoProvince.length > 1 && d[getGeoProvince[0].name] && d[getGeoProvince[1].name]) {
      const fromProvinceInfo = getProvinceArea(d[getGeoProvince[0].name])
      const toProvinceInfo = getProvinceArea(d[getGeoProvince[1].name])

      if (fromProvinceInfo && toProvinceInfo) {
        legendData.push(d[getGeoProvince[0].name])
        linesSeriesData = [{
          fromName: d[getGeoProvince[0].name],
          toName: d[getGeoProvince[1].name],
          coords: [[fromProvinceInfo.lon, fromProvinceInfo.lat], [toProvinceInfo.lon, toProvinceInfo.lat]]
        }]
        scatterData = [{
          name: d[getGeoProvince[1].name],
          value: [toProvinceInfo.lon, toProvinceInfo.lat, value]
        }]
      }
    } else {
      return
    }

    effectScatterType = {
      name: '',
      type: 'effectScatter',
      coordinateSystem: 'geo',
      zlevel: index,
      rippleEffect: {
          brushType: 'stroke'
      },
      ...labelOptionLines,
      symbolSize: (val) => {
          return 12
      },

      data: scatterData
    }

    linesType = {
      name: '',
      type: 'lines',
      zlevel: index,
      symbol: ['none', 'arrow'],
      symbolSize: 10,
      effect: {
          show: true,
          // period: 600,
          trailLength: 0,
          symbol: symbolType,
          symbolSize: 15,
          constantSpeed: linesSpeed
      },
      lineStyle: {
          normal: {
              width: 2,
              opacity: 0.6,
              curveness: 0.2
          }
      },
      data: linesSeriesData
    }
    linesSeries.push(linesType, effectScatterType)
  })

  let legendOption
  if (chartStyles.legend) {
    const {
      color,
      fontFamily,
      fontSize,
      legendPosition,
      selectAll,
      showLegend
    } = chartStyles.legend
    legendOption = {
      legend: getLegendOption(chartStyles.legend, legendData)
    }
  } else {
    legendOption = null
  }
  const visualMapOptions: EChartOption.VisualMap = getVisualMapOptions(min, max, layerType, chartStyles)
  let mapOptions
  switch (layerType) {
    case 'map':
      mapOptions = {
        geo: {
          map: mapName,
          roam
        },
        ...metricOptions,
        ...visualMapOptions,
        tooltip
      }
      break
    case 'lines':
      mapOptions = {
        ...legendOption,
        geo: {
          map: mapName,
          roam
        },
        series: linesSeries,
        ...visualMapOptions
      }
      break
    case 'scatter':
      mapOptions = {
        geo: {
          map: mapName,
          itemStyle: {
            normal: {
              areaColor: '#cccccc',
              borderColor: '#ffffff',
              borderWidth: 1
            },
            emphasis: {
              areaColor: '#bbbbbb'
            }
          },
          roam
        },
        ...metricOptions,
        ...visualMapOptions,
        tooltip
      }
      break
    case 'heatmap':
      mapOptions = {
        geo: {
          map: mapName,
          itemStyle: {
            normal: {
              areaColor: '#cccccc',
              borderColor: '#ffffff',
              borderWidth: 1
            },
            emphasis: {
              areaColor: '#bbbbbb'
            }
          },
          label: {
            emphasis: {
                show: true
            }
          },
          roam
        },
        ...metricOptions,
        ...visualMapOptions
      }
      break
  }

  return mapOptions
}



