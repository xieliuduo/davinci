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
          zoom: 1,
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
    labelOption
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
