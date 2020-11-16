import React from 'react'
import { Row, Col, Select, Checkbox } from 'antd'
import { mapDrillLevelOptions} from './constants'
const styles = require('../Workbench.less')
import { IDrillLeavel } from './'

interface IDrillLeavelProps {
  title: string
  config: IDrillLeavel
  onChange: (prop: string, value: any) => void
}
export class DrillLevelSection extends React.PureComponent<
  IDrillLeavelProps,
  {}
> {
  private selectChange = (prop) => (value) => {
    this.props.onChange(prop, value)
  }
  private checkboxChange = (prop) => (e) => {
    this.props.onChange(prop, e.target.checked)
  }

  public render() {
    const { title, config } = this.props
    const { enabled, level } = config

    return (
      <div className={styles.paneBlock}>
        <h4>{title}</h4>
        <div className={styles.blockBody}>
          <Row
            gutter={8}
            type="flex"
            align="middle"
            className={styles.blockRow}
          >
            <Col span={12}>
              <Checkbox
                checked={enabled}
                onChange={this.checkboxChange('enabled')}
              >
                开始下钻
              </Checkbox>
            </Col>
            <Col span={12}>
              <Select
                placeholder="下钻级别"
                className={styles.blockElm}
                value={level}
                onChange={this.selectChange('level')}
              >
                {mapDrillLevelOptions}
              </Select>
            </Col>
          </Row>
        </div>
      </div>
    )
  }
}

export default DrillLevelSection
