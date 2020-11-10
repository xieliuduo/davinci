import React from 'react'
import { IChartProps } from './index'
import chartlibs from '../../config/chart'
import echarts from 'echarts/lib/echarts'
import { ECharts } from 'echarts'
import chartOptionGenerator from '../../render/chart'
const styles = require('./Chart.less')

interface IChartStates {
  seriesItems: string[],
  mapName: string,
  mapData: object
}
export class Chart extends React.PureComponent<IChartProps, IChartStates> {
  private asyncEmitTimer: NodeJS.Timer | null = null
  private container: HTMLDivElement = null
  private instance: ECharts
  constructor(props) {
    super(props)
    this.state = {
      mapName: 'china',
      mapData: {
        mapName: 'china',
        mapScope: {
          range: 'country',
          initData: ['china']
        }
      },
      seriesItems: []
    }
  }
  public  mapNameHash = {
    河北: 'hebei',
    安徽: 'anhui',
    重庆: 'chongqing',
    青海: 'qinghai',
    四川: 'sichuan',
    北京: 'beijing',
    新疆: 'xinjiang'
  }
  public componentDidMount() {
    this.renderChart(this.props)
  }

  public componentDidUpdate() {
    this.renderChart(this.props)
  }

  private renderChart = (props: IChartProps) => {
    const {
      selectedChart,
      renderType,
      getDataDrillDetail,
      isDrilling,
      onError
    } = props
    const mapName = this.state.mapName
    const mapData = this.state.mapData
    if (mapName && mapName !== 'china') {
      const jsonMap = this.mapNameHash[mapName]
      const json = require(`assets/json/${jsonMap}.json`)
      if (json) {
        echarts.registerMap(mapName, json)
      }
    }
    if (renderType === 'loading') {
      return
    }
    if (!this.instance) {
      this.instance = echarts.init(this.container, 'default')
    } else {
      if (renderType === 'rerender') {
        this.instance.dispose()
        this.instance = echarts.init(this.container, 'default')
      }
      if (renderType === 'clear') {
        this.instance.clear()
      }
    }
    try {
      this.instance.off('click')
      this.instance.on('click', (params) => {
        console.log('click', 123)
        console.log('click', params)
        if (!params) {
          return
        }
        if (params.data && params.data.mapLevel === 'district') {
          const json = require(`assets/json/china.json`)
          if (json) {
            echarts.registerMap('china', json)
          }
          this.setState(
            {
              mapName: 'china',
              mapData: {
                mapName: 'china',
                mapScope: {
                  range: 'country',
                  initData: ['china']
                }
              }
            })
        }
        // if (!(params.name in this.mapNameHash)) {
        //   return
        // }
        if (params.data && params.data.mapLevel === 'province') {

          const jsonMap = this.mapNameHash[params.name]
          const json = require(`assets/json/${jsonMap}.json`)
          if (json) {
            echarts.registerMap(params.name, json)
           }
          this.setState(
            {
              mapName: params.name,
              mapData: {
                mapName: params.name,
                mapScope: {
                  range: 'province',
                  initData: [params.name]
                }
              }
            })
        }
        this.collectSelectedItems(params)
      })

      this.instance.setOption(
        chartOptionGenerator(
          chartlibs.find((cl) => cl.id === selectedChart).name,
          props,
          {
            instance: this.instance,
            isDrilling,
            getDataDrillDetail,
            selectedItems: this.props.selectedItems,
            mapName,
            mapData,
            callback: (seriesData) => {
              this.instance.off('click')
              this.instance.on('click', (params) => {
                this.collectSelectedItems(params, seriesData)
              })
            }
          }
        )
      )
      this.instance.resize()
    } catch (error) {
      if (onError) {
        onError(error)
      }
    }
  }

  public componentWillUnmount() {
    if (this.instance) {
      this.instance.off('click')
    }
    if (this.asyncEmitTimer) {
      clearTimeout(this.asyncEmitTimer)
    }
  }

  private collectSelectedItems = (params, seriesData?) => {
    const {
      data,
      selectedChart,
      onDoInteract,
      getDataDrillDetail,
      onSelectChartsItems,
      onCheckTableInteract
    } = this.props

    const { seriesItems } = this.state

    let selectedItems = []
    let series = []
    if (this.props.selectedItems && this.props.selectedItems.length) {
      selectedItems = [...this.props.selectedItems]
    }
    if (selectedChart === 7) {
      this.setState({ seriesItems: series })
    }
    let dataIndex = params.dataIndex
    if (selectedChart === 4) {
      dataIndex = params.seriesIndex
    }
    if (selectedItems.length === 0) {
      selectedItems.push(dataIndex)
    } else {
      const isb = selectedItems.some((item) => item === dataIndex)
      if (isb) {
        for (let index = 0, l = selectedItems.length; index < l; index++) {
          if (selectedItems[index] === dataIndex) {
            selectedItems.splice(index, 1)
            break
          }
        }
      } else {
        selectedItems.push(dataIndex)
      }
    }

    if (seriesData) {
      const { seriesIndex, dataIndex } = params
      const char = `${seriesIndex}&${dataIndex}`
      if (seriesItems && Array.isArray(seriesItems)) {
        series = seriesItems.includes(char)
          ? seriesItems.filter((item) => item !== char)
          : seriesItems.concat(char)
        this.setState({ seriesItems: series })
      }
    }
    const resultData = selectedItems.map((item, index) => {
      if (seriesData) {
        const seriesIndex = series[index] ? series[index].split('&')[0] : null
        return seriesData[seriesIndex] ? seriesData[seriesIndex][item] : []
      }
      return data[item]
    })
    const brushed = [{ 0: Object.values(resultData) }]
    const sourceData = Object.values(resultData)
    const isInteractiveChart = onCheckTableInteract && onCheckTableInteract()
    if (isInteractiveChart && onDoInteract) {
      const triggerData = sourceData
      onDoInteract(triggerData)
    }
    this.asyncEmitTimer = setTimeout(() => {
      if (getDataDrillDetail) {
        getDataDrillDetail(JSON.stringify({ range: null, brushed, sourceData }))
      }
    }, 500)
    if (onSelectChartsItems) {
      onSelectChartsItems(selectedItems)
    }
  }

  public render() {
    return (
      <div
        className={styles.chartContainer}
        ref={(f) => (this.container = f)}
      />
    )
  }
}

export default Chart
