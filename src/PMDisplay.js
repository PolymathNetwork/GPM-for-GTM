import React, {Fragment, useState} from 'react'
import { Table, Typography, Button, Icon, Form, Input, Modal, Spin, Select } from 'antd'
import useForm from 'rc-form-hooks'
import { _split } from './index'
import { utils as web3Utils } from 'web3'

const { Column } = Table
const { Text } = Typography
const { Item } = Form
const { Option } = Select

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
}
const rolesMap = {
  'PermissionsAdministrator': 'Permissions Administrator',
  'ShareholdersAdministrator' : 'Shareholders Administrator'
}

export default function PMDisplay({
  records,
  revokeRole,
  assignRole,
  roles
}) {
  records = records.map(({address, role}) => ({
    key: address,
    address: address,
    role
  }))
  const { getFieldDecorator, validateFields, errors, values, resetFields } = useForm()
  const [formVisible, setFormVisible] = useState(false)

  const rolesOpts = roles.map(role => ({
    value: role,
    label: rolesMap[role]
  }))
  const handleSubmit = async () => {
    const fields = ['address', 'role']
    validateFields(fields, { force: true })
      .then(async (values) => {
        console.log(values)

        try {
          await assignRole(values.address, values.role)
          resetFields()
        }
        catch (error) {
          console.error(error)
        }
        // Close form
        setFormVisible(false)
      })
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <Button
        type="primary"
        onClick={() => setFormVisible(true)}
        style={{alignSelf: 'flex-end', marginBottom: 20}}>Assign a role</Button>
      <Modal
        zIndex={0}
        title={'Assign a role'}
        okText="Save"
        closable={false}
        visible={formVisible}
        footer={null}
      >
        <Form {...formItemLayout}>
          <Item name="address" label="Address">
            {getFieldDecorator('address', {
              rules: [
                { required: true  },
                {
                  validator: (rule, value, callback) => {
                    if (!web3Utils.isAddress(value)) {
                      callback('Address is invalid')
                      return
                    }
                    callback()
                    return
                  }
                }
              ],
            })(<Input />)}
          </Item>
          <Item name="role" label="Role">
            {getFieldDecorator('role', {rules: [
              { required: true  }
            ]})(<Select>
              {rolesOpts.map(({value, label}) =>
                <Option key={label} value={value}>{label}</Option>)}
            </Select>)}
          </Item>
          <Item name="details" label="Details">
            {getFieldDecorator('details')(<Input />)}
          </Item>
          <Item>
            <Button onClick={() => setFormVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>Save</Button>
          </Item>
        </Form>
      </Modal>
      <Table size="middle" dataSource={records} rowKey={(address, role) => `${address}-${role}`}>
        <Column
          title='Address'
          dataIndex='address'
          key='address'
          render={(text) => <Text>{text}</Text>}
        />
        <Column
          title='Role'
          dataIndex='role'
          key='role'
          render={(role) => <Text>{_split(role)}</Text>}
        />
        <Column
          title='Actions'
          render={(text, record) => {
            return (
              <Fragment>
                <Button onClick={() => revokeRole(record.address, record.role)}>
                  <Icon type="delete" theme="filled" />
                </Button>
              </Fragment>
            )
          }}/>
      </Table>
    </div>
  )
}