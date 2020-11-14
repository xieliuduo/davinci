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
import { useState } from 'react'
import { IChartProps } from '../../../components/Chart'
import { EChartOption } from 'echarts'
import echarts from 'echarts/lib/echarts'
import {
  decodeMetricName,
  getTextWidth,
  getSizeRate
} from '../../../components/util'
import { getLegendOption, getLabelOption, getSymbolSize } from '../util'
import {
  getProvinceParent,
  getProvinceName,
  getCityArea,
  getProvinceArea,
  getVisualMapOptions
} from './utils'
import { getMapOption } from './type/map'
import { getScatterOption } from './type/scatter'
import { getHeatmapOption } from './type/heatmap'
import { getLinesOption } from './type/lines'
import { getFormattedValue } from '../../../components/Config/Format'
const mapJson = {}
export default function(chartProps: IChartProps, drillOptions) {

  const { chartStyles, data, cols, metrics, model } = chartProps
  const { label, spec, mapItemStyle, drillLevel, scope } = chartStyles
  // const initmapName = scope.city ? scope.city : scope.province ? scope.province : scope.country
  // const [mapName, setmapName] = useState(initmapName)
  const {
    labelColor,
    labelFontFamily,
    labelFontSize,
    labelPosition,
    showLabel
  } = label
  const itemStyle = {
      normal: {
            borderType: mapItemStyle.borderType,
            areaColor: mapItemStyle.areaColor,
            borderColor: mapItemStyle.borderColor,
            borderWidth: mapItemStyle.borderWidth
          },
      emphasis: {
            areaColor: mapItemStyle.areaColorEmphasis
          }
    }
  const { layerType, roam, linesSpeed, symbolType } = spec
  const mapNameHash = {
    北京: 'beijing',
    河北: '130000',
    安徽: 'anhui',
    重庆: 'chongqing',
    青海: 'qinghai',
    四川: 'sichuan',
    内蒙古: 'neimenggu',
    黑龙江: 'heilongjiang',
    新疆: 'xinjiang',
    china: '100000'
  }
  const {mapName, mapData } = drillOptions
  if (mapJson[mapName]) {
    // console.log('用缓存')
  } else {
    // console.log('新加载')
    const json = require(`assets/json/geoJson/${mapNameHash[mapName]}.json`)
    if (json) {
      mapJson[mapName] = json
      echarts.registerMap(mapName, json)
    }
  }
  const tooltip: EChartOption.Tooltip = {
    trigger: 'item',
    formatter: (params: EChartOption.Tooltip.Format) => {
      const { name, data, color } = params
      const tooltipLabels = []
      if (color) {
        tooltipLabels.push(
          `<span class="widget-tooltip-circle" style="background: ${color}"></span>`
        )
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
    zoom: 1,
    itemStyle,
    roam
  }
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
  const baseOption = {
    tooltip,
    geo,
    labelOption,
    itemStyle
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
}
