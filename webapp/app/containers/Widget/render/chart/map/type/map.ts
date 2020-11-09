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

import { IChartProps } from '../../../../components/Chart'
import { EChartOption } from 'echarts'
import {decodeMetricName} from '../../../../components/util'
import {
  getProvinceParent,
  getProvinceName,
  getCityArea,
  getProvinceArea,
  getVisualMapOptions
} from '../utils'
export function getMapOption(chartProps: IChartProps, drillOptions, baseOption) {

  const { chartStyles, data, cols, metrics, model } = chartProps
  const { label, spec } = chartStyles
  const { roam } = spec
  const {
    labelColor,
    labelFontFamily,
    labelFontSize,
    labelPosition,
    showLabel
  } = label

  const{ mapName } = drillOptions
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
              mapLevel: 'provice',
              children: {}
            }
          }
        }
      } else if (visualType === 'geoCity') {
        areaVal = record[col.name]
        const area = getCityArea(areaVal)
        if (area) {
          const provinceParent = getProvinceParent(area)
          const parentName = getProvinceName(provinceParent.name)
          if (!dataTree[parentName]) {
            dataTree[parentName] = {
              lon: area.lon,
              lat: area.lat,
              value: 0,
              mapLevel: 'City',
              children: {}
            }
          }
          dataTree[parentName].value += value
        }
      }
    })
  })
  const visualMapOptions: EChartOption.VisualMap = getVisualMapOptions(min, max, 'map', chartStyles)
  console.log(dataTree)
  console.log('dataTree')
  return {
    ...baseOption,
    ...visualMapOptions,
    series: {
      name: '地图',
      type: 'map',
      mapType: mapName,
      roam,
      ...labelOption,
      data: Object.keys(dataTree).map((key, index) => {
        const { lon, lat, value, mapLevel } = dataTree[key]
        return {
          name: key,
          value: [lon, lat, value],
          mapLevel
        }
      })
    }
  }
}
