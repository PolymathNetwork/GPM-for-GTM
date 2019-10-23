import React, {Fragment} from 'react'
import { Switch, Table, Typography, Button, Icon, Form, Input } from 'antd'
import useForm from 'rc-form-hooks'
import { utils as web3Utils } from 'web3'

const { Column } = Table
const { Text } = Typography
const { Item } = Form

export default function PMDisplay({enabled, onChange, delegates, removeDelegate, addDelegate}) {
  delegates = delegates.map(delegate => ({
    key: delegate,
    address: delegate
  }))
  const { getFieldDecorator, validateFields, errors, values, resetFields } = useForm()

  const handleSubmit = async () => {
    const fields = ['address']
    validateFields(fields, { force: true })
      .then(async (values) => {
        console.log(values)
        // dispatch({type: 'CREATING_TOKEN'})
        // const reservation = reservations.filter(r => r.symbol === values.symbol)[0]

        try {
          await addDelegate(values.address)
          // dispatch({ type: 'CREATED_TOKEN'})
          // message.success(`Token ${reservation.symbol} has been created successfully!`)
          resetFields()
        }
        catch (error) {
          console.error(error)
          // dispatch({ type: 'ERROR',
          // error: error.message} )
        }
      })
  }

  return (
    <Fragment>
      <Switch checked={enabled} onChange={onChange} />
      {enabled && <Fragment>
        <Form layout="inline" onSubmit={handleSubmit}>
          <Item
            // style={{textAlign: 'left', marginBottom: 25}}
            name="address"
            label="Address"
            // extra="Address of a wallet to be used to store tokens for some operations. Defaults to current user (eg Token Issuer) address"
          >
            {getFieldDecorator('address', {
              // initialValue: walletAddress,
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
              ] })(<Input />)}
          </Item>
          <Button type="primary" onClick={handleSubmit}>Submit</Button>
        </Form>
        <Table dataSource={delegates} rowKey="address">
          <Column
            title='Address'
            dataIndex='address'
            key='address'
            render={(text) => <Text>{text}</Text>}
          />
          <Column render={(text, record) => {
            return (
              <Fragment>
                <Button onClick={() => removeDelegate(record.address)}>
                  <Icon type="delete" theme="filled" />
                </Button>
              </Fragment>
            )
          }}/>
        </Table>
      </Fragment>
      }
    </Fragment>
  )
}