import React, { useReducer, useState, useEffect } from 'react'
import { axiosWithAuth } from '../../utils/axiosWithAuth'
import axios from 'axios'
import { AgGridReact } from 'ag-grid-react'
// import DataGrid from '../DataGrid'
import useGetToken from '../../hooks/useGetToken'

import { GridContext } from '../../contexts'
import { initialState, reducer } from '../../store'

import { Container } from 'reactstrap'
import { Dropdown, Button, Form } from 'semantic-ui-react'
import moment from 'moment'
import { DatePicker } from 'antd'

import { currencyOptions } from '../../config/gridDropdown'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-balham.css'
import 'antd/dist/antd.css'
import './Grid.scss'

const { RangePicker } = DatePicker
let callCache = []

const Grid = () => {
  const [store, dispatch] = useReducer(reducer, initialState)
  const { columnDefs, rowData, gridStyle } = store
  const [err, setErr] = useState(false)

  //Usestate to set inputs for table
  const [list, setList] = useState(null)

  // UseState to set queries in URL
  const [countryQuery, setCountryQuery] = useState()
  const [marketQuery, setMarketQuery] = useState()
  const [pCatQuery, setPCatQuery] = useState()
  const [pAggQuery, setPAggQuery] = useState()
  const [productQuery, setProductQuery] = useState()
  const [next, setNext] = useState(
    localStorage.getItem('next')
      ? JSON.parse(localStorage.getItem('next'))
      : null
  )
  const [prev, setPrev] = useState(
    localStorage.getItem('prev')
      ? JSON.parse(localStorage.getItem('prev'))
      : null
  )
  const [count, setCount] = useState(
    localStorage.getItem('count')
      ? JSON.parse(localStorage.getItem('count'))
      : 0
  )
  const [page, setPage] = useState(
    localStorage.getItem('page') ? JSON.parse(localStorage.getItem('page')) : 0
  )
  const [countries, setCountries] = useState(
    localStorage.getItem('c') ? JSON.parse(localStorage.getItem('c')) : []
  )
  const [markets, setMarkets] = useState(
    localStorage.getItem('m') ? JSON.parse(localStorage.getItem('m')) : []
  )
  const [pCats, setPCats] = useState(
    localStorage.getItem('pcat') ? JSON.parse(localStorage.getItem('pcat')) : []
  )
  const [pAggs, setPAggs] = useState(
    localStorage.getItem('pagg') ? JSON.parse(localStorage.getItem('pagg')) : []
  )
  const [products, setProducts] = useState(
    localStorage.getItem('p') ? JSON.parse(localStorage.getItem('p')) : []
  )
  const [currency, setCurrency] = useState(
    localStorage.getItem('cur') ? JSON.parse(localStorage.getItem('cur')) : ''
  )

  const [dateRanges, setDateRanges] = useState(
    localStorage.getItem('dates')
      ? deserialize(localStorage.getItem('dates'))
      : []
  )

  const [token] = useGetToken()
  const [agGridAPI, setAPI] = useState(null)

  useEffect(() => {
    const cachedRowData = localStorage.getItem('rowdata')
    if (cachedRowData) {
      dispatch({ type: 'SET_ROW_DATA', payload: JSON.parse(cachedRowData) })
    }
    axios
      .get('/sauti/client/superlist', {
        baseURL:
          process.env.NODE_ENV !== 'development'
            ? 'https://sauti-africa-market-master.herokuapp.com/'
            : 'http://localhost:8888/'
      })
      .then(res => {
        setList(res.data)
      })
      .catch(err => {
        console.log(err.message)
      })
  }, [])

  // Options for dropDown
  let countriesOptions,
    marketOptions,
    pCategoryOptions,
    pAggregatorOptions,
    productOptions
  if (list) {
    countriesOptions = list.countries.map((country, index) => ({
      key: `country-${index}`,
      value: country.country,
      text: country.country
    }))
    marketOptions = list.markets.map((market, index) => ({
      key: `market-${index}`,
      text: market.market,
      value: market.market
    }))
    pCategoryOptions = list.categories.map((product_cat, index) => ({
      key: `category-${index}`,
      text: product_cat.product_cat,
      value: product_cat.product_cat
    }))
    pAggregatorOptions = list.aggregators.map((product_agg, index) => ({
      key: `Aggregator-${index}`,
      text: product_agg.product_agg,
      value: product_agg.product_agg
    }))
    productOptions = list.products.map((product, index) => ({
      key: `product-${index}`,
      text: product.product,
      value: product.product
    }))
  }

  // Submit handlers for dropDown
  const dropdownHandler = (value, valueUpdater, queryUpdater, prefix) => {
    valueUpdater(value)
    if (Array.isArray(value)) {
      if (value.length) {
        queryUpdater(`&${prefix}=${value.join(`&${prefix}=`)}`)
      } else {
        queryUpdater(null)
      }
    }
    localStorage.setItem(prefix, JSON.stringify(value))
  }

  function serialize(collection) {
    return JSON.stringify(collection, function(k, v) {
      if (
        typeof v === 'string' &&
        v.match(
          /\d{4}-[01]\d-[0-3]\dT?[0-2]\d:[0-5]\d(?::[0-5]\d(?:.\d{1,6})?)?(?:([+-])([0-2]\d):?([0-5]\d)|Z)/
        )
      ) {
        return 'moment:' + moment(v).valueOf()
      }
      return v
    })
  }

  function deserialize(serializedData) {
    return JSON.parse(serializedData, function(k, v) {
      if (typeof v === 'string' && v.includes('moment:')) {
        return moment(parseInt(v.split(':')[1], 10))
      }
      return v
    })
  }

  function datesHandler(dates) {
    if (dates) {
      setDateRanges(dates)
      localStorage.setItem('dates', serialize(dates))
    } else localStorage.removeItem('dates')
  }

  function resetSearch() {
    callCache = []
    dropdownHandler([], setCountries, setCountryQuery, 'c')
    dropdownHandler([], setMarkets, setMarketQuery, 'm')
    dropdownHandler([], setProducts, setProductQuery, 'p')
    dropdownHandler([], setPCats, setPCatQuery, 'pcat')
    dropdownHandler([], setPAggs, setPAggQuery, 'pagg')
    dropdownHandler('', setCurrency, null, 'cur')
    datesHandler([])
    localStorage.clear()
    setPage(0)
    setCount(0)
    setPrev([])
    setNext([])
    dispatch({ type: 'SET_ROW_DATA', payload: [] })
  }

  function disabledDate(current) {
    // Can not select days after today and today
    return current && current > moment().endOf('day')
  }

  const onGridReady = params => {
    params.api.sizeColumnsToFit()
    setAPI(params.api)
  }

  const nextApiCall = async () => {
    if (callCache[page + 1]) {
      const p = page
      const currentPage = typeof p === 'number' ? p + 1 : 1
      dispatch({
        type: 'SET_ROW_DATA',
        payload: callCache[currentPage].records
      })
      localStorage.setItem(
        'rowdata',
        JSON.stringify(callCache[currentPage].records)
      )
      await setPage(currentPage)
      localStorage.setItem('page', JSON.stringify(currentPage))
      await setPrev([...prev, callCache[currentPage].prev])
      await setNext([...next, callCache[currentPage].next])
      localStorage.setItem(
        'prev',
        JSON.stringify([...prev, callCache[currentPage].prev])
      )
      localStorage.setItem(
        'next',
        JSON.stringify([...next, callCache[currentPage].next])
      )
    } else {
      agGridAPI.showLoadingOverlay()
      const dateRangeQuery =
        dateRanges && dateRanges[0]
          ? `&startDate=${dateRanges[0].format(
              'YYYY-MM-DD'
            )}&endDate=${dateRanges[1].format('YYYY-MM-DD')}`
          : ''
      setErr(false)
      let nextCursor = null
      let n = next[next.length - 1]
      if (next) nextCursor = n
      axiosWithAuth([token])
        .get(
          `/sauti/client/?currency=${currency || 'USD'}${countryQuery ||
            ''}${marketQuery || ''}${pCatQuery || ''}${pAggQuery ||
            ''}${productQuery || ''}${dateRangeQuery}&next=${nextCursor}`,
          {
            baseURL:
              process.env.NODE_ENV !== 'development'
                ? 'https://sauti-africa-market-master.herokuapp.com/'
                : 'http://localhost:8888/'
          }
        )
        .then(async res => {
          dispatch({ type: 'SET_ROW_DATA', payload: res.data.records })
          localStorage.setItem('rowdata', JSON.stringify(res.data.records))

          const p = page
          const currentPage = typeof p === 'number' ? p + 1 : 1

          await setPrev([...prev, res.data.prev])
          await setNext([...next, res.data.next])
          await setPage(currentPage)
          callCache[currentPage] = res.data
          localStorage.setItem('prev', JSON.stringify([...prev, res.data.prev]))
          localStorage.setItem('next', JSON.stringify([...next, res.data.next]))
          localStorage.setItem('page', JSON.stringify(currentPage))
        })
        .catch(e => {
          console.log({ apiCallErr: e })
          setErr(true)
        })
    }
  }

  const prevApiCall = async () => {
    if (callCache[page - 1]) {
      let p = page
      const currentPage = typeof p === 'number' && p > 1 ? p - 1 : 1
      dispatch({
        type: 'SET_ROW_DATA',
        payload: callCache[currentPage].records
      })
      localStorage.setItem(
        'rowdata',
        JSON.stringify(callCache[currentPage].records)
      )
      await setPage(currentPage)
      localStorage.setItem('page', JSON.stringify(currentPage))
      await setPrev([...prev, callCache[currentPage].prev])
      await setNext([...next, callCache[currentPage].next])
      localStorage.setItem(
        'prev',
        JSON.stringify([...prev, callCache[currentPage].prev])
      )
      localStorage.setItem(
        'next',
        JSON.stringify([...next, callCache[currentPage].next])
      )
    } else {
      agGridAPI.showLoadingOverlay()
      const dateRangeQuery =
        dateRanges && dateRanges[0]
          ? `&startDate=${dateRanges[0].format(
              'YYYY-MM-DD'
            )}&endDate=${dateRanges[1].format('YYYY-MM-DD')}`
          : ''

      setErr(false)
      let p = page
      const currentPage = typeof p === 'number' && p > 1 ? p - 1 : 1
      await setPage(currentPage)

      localStorage.setItem('page', JSON.stringify(currentPage))
      let nextCursor = null
      let nextPage = null
      if (prev && page) nextPage = prev[page - 2]
      if (nextPage) nextCursor = nextPage
      axiosWithAuth([token])
        .get(
          `/sauti/client/?currency=${currency || 'USD'}${countryQuery ||
            ''}${marketQuery || ''}${pCatQuery || ''}${pAggQuery ||
            ''}${productQuery || ''}${dateRangeQuery}&next=${nextCursor}`,
          {
            baseURL:
              process.env.NODE_ENV !== 'development'
                ? 'https://sauti-africa-market-master.herokuapp.com/'
                : 'http://localhost:8888/'
          }
        )
        .then(async res => {
          dispatch({ type: 'SET_ROW_DATA', payload: res.data.records })
          localStorage.setItem('rowdata', JSON.stringify(res.data.records))

          await setPrev([...prev, res.data.prev])
          await setNext([...next, res.data.next])
          callCache[currentPage] = res.data
          localStorage.setItem('prev', JSON.stringify([...prev, res.data.prev]))
          localStorage.setItem('next', JSON.stringify([...next, res.data.next]))
        })
        .catch(e => {
          console.log({ apiCallErr: e })
          setErr(true)
        })
    }
  }

  const apiCall = async () => {
    if (callCache[page - 1 || page]) {
      let p = page
      const currentPage = typeof p === 'number' && p > 1 ? p - 1 : 1
      dispatch({
        type: 'SET_ROW_DATA',
        payload: callCache[currentPage].records
      })
      localStorage.setItem(
        'rowdata',
        JSON.stringify(callCache[currentPage].records)
      )

      setNext([...next, callCache[currentPage].next])
      localStorage.setItem(
        'next',
        JSON.stringify([...next, callCache[currentPage].next])
      )
      let newCount = Math.ceil(
        parseInt(callCache[currentPage].count[0]['count(*)']) / 50
      )

      await setPrev([...prev, callCache[currentPage].prev])
      await setPage(currentPage)
      await setCount(newCount)
      localStorage.setItem(
        'prev',
        JSON.stringify([...prev, callCache[currentPage].prev])
      )
      localStorage.setItem('page', JSON.stringify(currentPage))
      localStorage.setItem('count', newCount)
    } else {
      agGridAPI.showLoadingOverlay()
      const dateRangeQuery =
        dateRanges && dateRanges[0]
          ? `&startDate=${dateRanges[0].format(
              'YYYY-MM-DD'
            )}&endDate=${dateRanges[1].format('YYYY-MM-DD')}`
          : ''
      setErr(false)
      axiosWithAuth([token])
        .get(
          `/sauti/client/?currency=${currency || 'USD'}${countryQuery ||
            ''}${marketQuery || ''}${pCatQuery || ''}${pAggQuery ||
            ''}${productQuery || ''}${dateRangeQuery}`,
          {
            baseURL:
              process.env.NODE_ENV !== 'development'
                ? 'https://sauti-africa-market-master.herokuapp.com/'
                : 'http://localhost:8888/'
          }
        )
        .then(async res => {
          let p = page
          const currentPage = typeof p === 'number' && p > 1 ? p - 1 : 1
          dispatch({ type: 'SET_ROW_DATA', payload: res.data.records })
          localStorage.setItem('rowdata', JSON.stringify(res.data.records))
          callCache[currentPage] = res.data

          setNext([...next, res.data.next])
          localStorage.setItem('next', JSON.stringify([...next, res.data.next]))
          let newCount = Math.ceil(parseInt(res.data.count[0]['count(*)']) / 50)

          await setPrev([...prev, res.data.prev])
          await setPage(currentPage)
          await setCount(newCount)
          localStorage.setItem('prev', JSON.stringify([...prev, res.data.prev]))
          localStorage.setItem('page', JSON.stringify(currentPage))
          localStorage.setItem('count', newCount)
        })
        .catch(e => {
          console.log({ apiCallErr: e })
          setErr(true)

          agGridAPI.hideOverlay()
        })
    }
  }

  return (
    <Container className="flex-grow-1 mt-5">
      <GridContext.Provider value={{ store, dispatch }}>
        <div>
          {err ? (
            <div>You've reached the max amount of calls!</div>
          ) : token ? (
            <>
              <Form>
                <Dropdown
                  placeholder="Countries"
                  fluid
                  multiple
                  search
                  selection
                  options={countriesOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setCountries, setCountryQuery, 'c')
                  }
                  value={countries}
                />
                <Dropdown
                  placeholder="Markets"
                  fluid
                  multiple
                  search
                  selection
                  options={marketOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setMarkets, setMarketQuery, 'm')
                  }
                  value={markets}
                />
                <Dropdown
                  placeholder="Product Category"
                  fluid
                  multiple
                  search
                  selection
                  options={pCategoryOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setPCats, setPCatQuery, 'pcat')
                  }
                  value={pCats}
                />
                <Dropdown
                  placeholder="Product Aggregator"
                  fluid
                  multiple
                  search
                  selection
                  options={pAggregatorOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setPAggs, setPAggQuery, 'pagg')
                  }
                  value={pAggs}
                />
                <Dropdown
                  placeholder="Products"
                  fluid
                  multiple
                  search
                  selection
                  options={productOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setProducts, setProductQuery, 'p')
                  }
                  value={products}
                />
                <Dropdown
                  placeholder="Currency"
                  fluid
                  search
                  selection
                  options={currencyOptions}
                  onChange={(e, { value }) =>
                    dropdownHandler(value, setCurrency, null, 'cur')
                  }
                  value={currency}
                />
                <RangePicker
                  value={dateRanges}
                  disabledDate={disabledDate}
                  onChange={(dates, date) => {
                    datesHandler(dates)
                  }}
                />
              </Form>
              <div>
                <Button
                  onClick={() => {
                    callCache = []
                    apiCall()
                  }}
                >
                  Update Grid
                </Button>
                <Button onClick={() => resetSearch()}>Reset</Button>
                {rowData[0] && (
                  <Button onClick={() => agGridAPI.exportDataAsCsv(rowData)}>
                    Export CSV
                  </Button>
                )}
              </div>
            </>
          ) : null}

          <div style={gridStyle} className="ag-theme-balham">
            <AgGridReact
              // properties
              columnDefs={columnDefs}
              rowData={rowData}
              domLayout="autoHeight"
              reactNext={true}
              // events
              onGridReady={onGridReady}
            ></AgGridReact>
          </div>
          {!page ? (
            <Button disabled>{'<'}</Button>
          ) : page === 2 ? (
            <Button onClick={apiCall}>{'<'}</Button>
          ) : page === 1 ? (
            <Button disabled>{'<'}</Button>
          ) : (
            <Button onClick={prevApiCall}>{'<'}</Button>
          )}
          {next && page < count ? (
            <Button onClick={nextApiCall}>{`>`}</Button>
          ) : (
            <Button disabled onClick={nextApiCall}>{`>`}</Button>
          )}
          {page ? <span>{`${page} of ${count}`}</span> : null}
        </div>
      </GridContext.Provider>
    </Container>
  )
}

export default Grid
