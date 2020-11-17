
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
import geoData from 'assets/js/geo.js'
import geoCode from 'assets/js/pcl.js'
import areas from 'assets/js/areas'
import citys from 'assets/js/citys'
import provinces from 'assets/js/provinces'
import {
  DEFAULT_ECHARTS_THEME
} from 'app/globalConstants'
interface ImapData {
  mapName: string,
  mapLevel: string,
  currentCode: string
}
interface IFields {
  provinceField: string,
  cityField: string,
  areaField: string
}
 //     provinceField: '',
    //     cityField: '',
    //     areaField: ''
const provinceSuffix = ['省', '市', '特别行政区', '维吾尔自治区', '回族自治区', '壮族自治区', '自治区', '行政区']
const citySuffix = ['自治州', '市', '区', '市辖区', '县', '旗', '盟', '镇']

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
export function getCityName(name) {
  citySuffix.forEach((ps) => {
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
// ---
export function getProvinceGeoByName(name) {
  const hasSuffix = provinceSuffix.some((suffix) => name.includes(suffix))
  const geo = hasSuffix
    ? provinces.find((p) => p.label === name)
    : provinces.find((p) => p.label.includes(name))
  return geo
}
export function getCityGeoByName(cityName: string, provinceCode: string) {

    const hasSuffix = citySuffix.some((suffix) => cityName.includes(suffix))
    const  geo = hasSuffix
        ? citys.find((c) => c.label === cityName && c.provinceCode === provinceCode)
        : citys.find((c) => c.label.includes(cityName) && c.provinceCode === provinceCode)
    return geo

}

export function getDataByProvinceField(provinceField: string, valueField: string, data: object[]) {
        const dataTree = {}
        data.forEach((record) => {
            const value = record[valueField]
            const area = getProvinceGeoByName(record[provinceField])
            const provinceName = getProvinceName(record[provinceField])
            if (area) {
                if (!dataTree[provinceName]) {
                    dataTree[provinceName] = {
                        lon: area.lon,
                        lat: area.lat,
                        value,
                        mapLevel: 'country', // province district
                        mapCode: area.value,
                        parentCode: 'china',
                        children: []
                    }
                    console.log('area', area)

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
                        mapCode: area.value,
                        parentCode: 'china',
                        children: []
                    }
                }
                dataTree[parentName].children.push([area.name, value])
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
export function getDataByProvinceField2(provinceField, valueField: string, listData: object[]) {
  const dataTree = {}
  listData.forEach((record) => {
            const value = record[valueField]
            const pGeo = getProvinceGeoByName(record[provinceField])
            if (pGeo) {
                const pName = getProvinceName(pGeo.label)
                if (!dataTree[pName]) {
                        dataTree[pName] = {
                            lon: pGeo.lon,
                            lat: pGeo.lat,
                            value,
                            curMapCode: pGeo.value,
                            curMapName: pGeo.label,
                            mapLevel: 'province',
                            children: []
                        }
                    }

            }
        })
  return dataTree
}
export function getProvinceDataBycityField2(fields: IFields, mapData: ImapData, valueField: string, listData: object[]) {
   const dataTree = {}
   const provinceCode = provinces.find((p) => p.value === mapData.currentCode)
   listData.forEach((record) => {
             const cGeo = getCityGeoByName(record[fields.cityField], mapData.currentCode)
             if (cGeo) {
              const value = record[valueField]


              const cName = getCityName(cGeo.label)
              if (!dataTree[cName]) {
                        dataTree[cName] = {
                            lon: cGeo.lon,
                            lat: cGeo.lat,
                            value,
                            curMapCode: cGeo.value,
                            curMapName: cGeo.label,
                            mapLevel: 'city',
                            children: []
                        }
                    }

            }
        })
   return dataTree
}
export function newGetData(fields: IFields, mapData: ImapData, valueField: string, listData: object[]) {
      let dataTree = {}
      if (mapData.mapLevel === 'country') {
        if (fields.provinceField) {
         dataTree = getDataByProvinceField2(fields.provinceField, valueField, listData)
         return dataTree
        } else {
          alert('缺少省级数据')
        }
      }
      if (mapData.mapLevel === 'province') {
        if (fields.cityField) {
         dataTree = getProvinceDataBycityField2(fields, mapData, valueField, listData)
         return dataTree
        } else {
          alert('缺少城市级数据')
        }
      }

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
export  function getAggValueByArr(arr, agg) {
        let res = 0
        function keyArr(arr) {
          return arr.map((item) => item[0])
        }
        function valueArr(arr) {
          return arr.map((item) => item[1])
        }
        function getsun(arr) {
            return arr.reduce((total, item) => {
                    return total + item[1]
                }, 0)
        }
        function getCOUNTDISTINCT(arr) {
          const keys = keyArr(arr)
          return Array.from(new Set(keys)).length
        }
        function getAvg(arr) {
          const values = valueArr(arr)
          if (!values.length) {return 0 }
          return +(getsun(arr) / values.length).toFixed(4)
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
              // TODO fix
               res = getCOUNTDISTINCT(arr)
               break
            case 'max':
               res = Math.max(...valueArr(arr))
               break
            case 'min':
               res = Math.min(...valueArr(arr))
               break
            default:
                break
        }
        return res
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
