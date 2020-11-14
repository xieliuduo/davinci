import React from 'react'
import { Row, Col, Select, Cascader } from 'antd'
import mapCodeJson from 'assets/json/chinaCode.json'
const styles = require('../Workbench.less')
import { IAreaScpoe } from './'

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
        const  scpoeValue = {
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
                                fieldNames={{ label: 'label', value: 'code' }}
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

export default AreaScpoeSection
