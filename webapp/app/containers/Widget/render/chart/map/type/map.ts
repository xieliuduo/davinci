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
import { decodeMetricName } from '../../../../components/util'
import {
    getVisualMapOptions,
    getAggValueByArr,
    getMinMaxByDataTree,
    getDataByProvinceField,
    getDataByCityField,
    getDataByCityFieldForProvince
} from '../utils'
export function getMapOption(
    chartProps: IChartProps,
    drillOptions,
    baseOption
) {
    const { chartStyles, data, cols, metrics, model } = chartProps
    const { spec , scope} = chartStyles
    const { roam } = spec
    const { mapData } = drillOptions
    console.log('drillOptions mapData', mapData)

    let dataTree = {}

    const agg = metrics[0].agg
    const metricName = decodeMetricName(metrics[0].name)
    const valueField = `${agg}(${metricName})`
    dataTree = getDataTree()
    function getDataTree() {
        let dataTree
        if (mapData.currentLevel === 'country') {
            //  const districtField = cols.find((field) => model[field.name].visualType  === 'geoDistrict')
            //  if (districtField) {
            //      dataTree = getDataByDistrictField(provinceField.name, data)
            //      return dataTree
            //  }
            const cityField = cols.find(
                (field) => model[field.name].visualType === 'geoCity'
            )
            if (cityField) {
                dataTree = getDataByCityField(cityField.name, valueField, data)
                for (const key in dataTree) {
                    if (Object.prototype.hasOwnProperty.call(dataTree, key)) {
                        dataTree[key].value = getAggValueByArr(dataTree[key].children, agg)
                    }
                }
                return dataTree
            }
            const provinceField = cols.find(
                (field) => model[field.name].visualType === 'geoProvince'
            )
            if (provinceField) {
                dataTree = getDataByProvinceField(provinceField.name, valueField, data)
                return dataTree
            }
            return {}
        }
        if (mapData.currentLevel === 'province') {
            //  const districtField = cols.find((field) => model[field.name].visualType  === 'geoDistrict')
            //  if (districtField) {
            //      dataTree = getDataByDistrictField(provinceField.name, data)
            //      return dataTree
            //  }
            const cityField = cols.find(
                (field) => model[field.name].visualType === 'geoCity'
            )
            if (cityField) {
                dataTree = getDataByCityFieldForProvince(cityField.name, valueField, data, '河北')
                return dataTree
            }
            return {}
        }
    }
    const { min = 0, max = 0 } = getMinMaxByDataTree(dataTree)
    const visualMapOptions: EChartOption.VisualMap = getVisualMapOptions(
        min,
        max,
        'map',
        chartStyles
    )
    const { tooltip, geo, labelOption, itemStyle } = baseOption
    const mapItem = visualMapOptions.show ? {} : itemStyle
    const seriesData = Object.keys(dataTree).map((key, index) => {
        const { lon, lat, value, mapLevel } = dataTree[key]
        return {
            name: key,
            value: [lon, lat, value],
            mapLevel
        }
    })
    console.log('data', data)
    console.log('dataTree', dataTree)
    console.log('seriesData', seriesData)
    return {
        tooltip,
        ...visualMapOptions,
        series: {
            name: '地图',
            type: 'map',
            mapType: mapData.currentCode,
            roam,
            itemStyle: mapItem,
            ...labelOption,
            data: seriesData
        }
    }
}
