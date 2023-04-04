import { useEffect } from 'react'
import '@/styles/index.css'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import Dom from '@/components/layout/dom'

import Header from '@/config'
import useStore from '@/helpers/store'

const LCanvas = dynamic(() => import('@/components/layout/canvas'), {
  ssr: false,
})

function App({ Component, pageProps = { title: 'index' } }) {
  const router = useRouter()

  useEffect(() => {
    useStore.setState({ router })
  }, [router])

  return (
    <>
      <Header title={pageProps.title} />
      <Dom>
        <Component {...pageProps} />
      </Dom>
      {Component?.r3f && (
        <LCanvas orthographic={pageProps.camera === 'orthographic'}>
          {Component.r3f(pageProps)}
        </LCanvas>
      )}
    </>
  )
}

export default App
