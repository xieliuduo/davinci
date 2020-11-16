import React from 'react'
import { IChartProps } from './index'
import chartlibs from '../../config/chart'
import echarts from 'echarts/lib/echarts'
import { ECharts } from 'echarts'
import chartOptionGenerator from '../../render/chart'
const styles = require('./Chart.less')

interface IChartStates {
  seriesItems: string[],
}
export class Chart extends React.PureComponent<IChartProps, IChartStates> {
  private asyncEmitTimer: NodeJS.Timer | null = null
  private container: HTMLDivElement = null
  private instance: ECharts
  private mapData = {
    currentCode: '100000',
    currentLevel: 'country'
  }
  constructor(props) {
    super(props)
    this.state = {
      seriesItems: []
    }
  }
  public componentDidMount() {
    this.mapData = this.getMapData(this.props)
    this.renderChart(this.props, this.mapData)
  }

  public componentDidUpdate() {
    console.log('componentDidUpdate')
    this.mapData = this.getMapData(this.props)
    this.renderChart(this.props, this.mapData)
  }
  private getMapData = (props: IChartProps) => {
    const mapData = { currentLevel: '', currentCode: ''}
    const { selectedChart, chartStyles } = props
    if (selectedChart !== 7) {
      return
    }
    const { scope } = chartStyles

    if (scope.city) {
      mapData.currentLevel = 'city'
      mapData.currentCode = scope.city
    } else if (scope.province) {
      mapData.currentLevel = 'province'
      mapData.currentCode = scope.province
    } else if (scope.country) {
      mapData.currentLevel = 'country'
      mapData.currentCode = scope.country
    }
    return mapData
  }
  private renderChart = (props: IChartProps, mapData) => {
    const {
      selectedChart,
      renderType,
      getDataDrillDetail,
      isDrilling,
      onError
    } = props
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
      let drillOptions = {}
      if (selectedChart === 7) {
        drillOptions = {
          instance: this.instance,
          isDrilling,
          mapData
        }
      } else {
        drillOptions = {
          instance: this.instance,
          isDrilling,
          mapData,
          getDataDrillDetail,
          selectedItems: this.props.selectedItems,
          callback: (seriesData) => {
            this.instance.on('click', (params) => {
              this.collectSelectedItems(params, seriesData)
            })
          }
        }
      }

      this.instance.on('click', (params) => {

        if (selectedChart === 7) {
          if (params.name) {
            console.log('7')
            if (params.name === '河北') {
              mapData.currentLevel = 'province'
              mapData.currentCode = '130000'
              this.renderChart(this.props, mapData)
            }
          }
        } else {
          this.collectSelectedItems(params)
        }
      })

      const option = chartOptionGenerator(
        chartlibs.find((cl) => cl.id === selectedChart).name,
        props,
        drillOptions
      )
      this.instance.setOption(
        option
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
