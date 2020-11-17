import React from 'react'  
import { Row, Col, Cascader } from 'antd'
// import mapCodeJson from 'assets/js/pcl'
import areas from 'assets/js/areas'
import citys from 'assets/js/citys'
import provinces from 'assets/js/provinces'
const styles = require('../Workbench.less')
import { IAreaScpoe } from '.'
 
// 如果下钻到区县可以打开此处
// areas.forEach(area=>{
//     const city = citys.find(city=>city.value==area.cityCode)
//     if (city){
//         city.children.push(area)
//     }
// })
citys.forEach(city => {
    const province = provinces.find(province => province.value == city.provinceCode)
    if (province) {
        province.children.push(city)
    }
})
const mapCodeJson = [
    {
        label: '中国',
        value: "china",
        lon: 117.21081309155,
        lat: 39.14392990331,
        children: provinces
    }
]

interface IAreaScpoeSectionProps {
    title: string
    config: IAreaScpoe
    onChange: (value: IAreaScpoe) => void
}

export class AreaScpoeSection extends React.PureComponent<
    IAreaScpoeSectionProps,
    {}
    > {
    private onSectionChange = (value) => {
        const scpoeValue = {
            country: value[0],
            province: value[1] || '',
            city: value[2] || ''
        }
        this.props.onChange(scpoeValue)
    }
    public render() {
        const { title, config } = this.props
        return (
            <div className={styles.paneBlock}>
                <h4>{title}</h4>
                <div className={styles.blockBody}>
                    <Row gutter={8} type="flex" align="middle" className={styles.blockRow}>
                        <Col span={24}>
                            <Cascader
                                allowClear={false}
                                placeholder="地图初始范围"
                                style={{ width: '100%' }}
                                size="middle"
                                changeOnSelect
                                expandTrigger="hover"
                                defaultValue={[config.country, config.province, config.city]}
                                options={mapCodeJson}
                                onChange={this.onSectionChange}
                                fieldNames={{ label: 'label', value: 'value' }}
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

export default AreaScpoeSection
