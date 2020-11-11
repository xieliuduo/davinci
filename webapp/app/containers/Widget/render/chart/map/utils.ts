
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
import geoData from 'assets/js/geo.js'
import {
  DEFAULT_ECHARTS_THEME
} from 'app/globalConstants'

const provinceSuffix = ['省', '市', '特别行政区', '维吾尔自治区', '回族自治区', '壮族自治区', '自治区', '行政区']
const citySuffix = ['自治州', '市', '区', '县', '旗', '盟', '镇']

export function getProvinceParent(area) {
  if (!area.parent) {
    return area
  }
  const parent = geoData.find((g) => g.id === area.parent)
  return !parent.parent ? parent : getProvinceParent(parent)
}

export function getProvinceName(name) {
  provinceSuffix.forEach((ps) => {
    if (name.includes(ps)) {
      name = name.replace(ps, '')
    }
  })
  return name
}

export function getCityArea(name) {
  const hasSuffix = citySuffix.some((p) => name.includes(p))
  const area = hasSuffix
    ? geoData.find((d) => d.name === name)
    : geoData.find((d) => d.name.includes(name))
  return area
}

export function getProvinceArea(name) {
  const hasSuffix = provinceSuffix.some((p) => name.includes(p))
  const area = hasSuffix
    ? geoData.find((d) => d.name === name && !d.parent)
    : geoData.find((d) => d.name.includes(name) && !d.parent)
  return area
}
export function getPosition(position: string) {
    const positionMap = {
        leftBottom: {left: 'left', top: 'bottom'},
        leftTop: {left: 'left', top: 'top'},
        rightTop: {left: 'right', top: 'top'},
        rightBottom: {left: 'right', top: 'bottom'}
    }
    // 默认值
    let positionValue = positionMap.leftBottom
    if (position in positionMap) {
        positionValue = positionMap[position]
    }
    return positionValue
}

export function getVisualMapOptions(min: number, max: number, layerType: string, chartStyles) {
    let visualMapOptions
    if (chartStyles.visualMap) {
    const {
      showVisualMap,
      visualMapPosition,
      fontFamily,
      fontSize,
      visualMapDirection,
      visualMapWidth,
      visualMapHeight,
      startColor,
      endColor
    } = chartStyles.visualMap

    visualMapOptions = {
      visualMap: {
        show: layerType === 'lines' ? false : showVisualMap,
        min,
        max,
        seriesIndex: [0],
        calculable: true,
        inRange: {
          color: [startColor, endColor]
        },
        ...getPosition(visualMapPosition),
        itemWidth: visualMapWidth,
        itemHeight: visualMapHeight,
        textStyle: {
          fontFamily,
          fontSize
        },
        orient: visualMapDirection
      }
    }
     } else {
    visualMapOptions = {
      visualMap: {
        show: false,
        min,
        max,
        seriesIndex: [0],
        calculable: true,
        inRange: {
          color: DEFAULT_ECHARTS_THEME.visualMapColor
        },
        left: 10,
        bottom: 20,
        itemWidth: 20,
        itemHeight: 50,
        textStyle: {
          fontFamily: 'PingFang SC',
          fontSize: 12
        },
        orient: 'vertical'
      }
    }
  }
    return visualMapOptions
}
export  function getAggValueByArr(arr, agg) {
        let res = 0
        function getsun(arr) {
            return arr.reduce((total, num) => {
                    return total + num
                })
        }
        function getAvg(arr) {
            if (!arr.length) {return 0 }
            return +(getsun(arr) / arr.length).toFixed(2)
        }
        switch (agg) {
            case 'sum':
               res = getsun(arr)
               break
            case 'avg':
               res = getAvg(arr)
               break
            case 'count':
               res = getsun(arr)
               break
            case 'COUNTDISTINCT':
               res = getsun(arr)
               break
            case 'max':
               res = Math.max(...arr)
               break
            case 'min':
               res = Math.min(...arr)
               break
            default:
                break
        }
        return res
    }
export function getMinMaxByDataTree(dataTree: object) {
        const dataArr = Object.values(dataTree).map((item) => item.value)
        let min = Math.min(...dataArr)
        const max = Math.max(...dataArr)
        if (min === max) {
            min = min - 10
        }
        return { min, max }
    }
export function getDataByProvinceField(provinceField: string, valueField: string, data: object[]) {
        const dataTree = {}
        data.forEach((record) => {
            const value = record[valueField]
            const area = getProvinceArea(record[provinceField])
            const provinceName = getProvinceName(record[provinceField])
            if (area) {
                if (!dataTree[provinceName]) {
                    dataTree[provinceName] = {
                        lon: area.lon,
                        lat: area.lat,
                        value,
                        mapLevel: 'district', // province district
                        children: {}
                    }
                }
            }
        })
        return dataTree
    }
export  function getDataByCityField(cityField: string, valueField: string, data: object[]) {
        const dataTree = {}
        data.forEach((record) => {
            const value = record[valueField]
            const area = getCityArea(record[cityField])
            if (area) {
                const provinceParent = getProvinceParent(area)
                const parentName = getProvinceName(provinceParent.name)
                if (!dataTree[parentName]) {
                    dataTree[parentName] = {
                        lon: area.lon,
                        lat: area.lat,
                        value: 0,
                        mapLevel: 'province',
                        children: []
                    }
                }
                dataTree[parentName].children.push(value)
            }
        })
        return dataTree
    }
export function getDataByCityFieldForProvince(cityField: string, valueField: string, data: object[], province: string) {
        const dataTree = {}
        data.forEach((record) => {
            const value = record[valueField]
            const area = getCityArea(record[cityField])
            if (area) {
                const provinceParent = getProvinceParent(area)
                const parentName = getProvinceName(provinceParent.name)
                if (parentName === province) {
                    if (!dataTree[area.name]) {
                        dataTree[area.name] = {
                            lon: area.lon,
                            lat: area.lat,
                            value,
                            mapLevel: 'district',
                            children: []
                        }
                    }
                }
            }
        })
        return dataTree
    }
