// Step 5 - delete Instructions components
import dynamic from 'next/dynamic'

// Dynamic import is used to prevent a payload when the website start that will include threejs r3f etc..
// WARNING ! errors might get obfuscated by using dynamic import.
// If something goes wrong go back to a static import to show the error.
// https://github.com/pmndrs/react-three-next/issues/49
const Text = dynamic(() => import('@/components/canvas/Text'), {
  ssr: false,
})
// import Text from '@/components/canvas/Text'

// dom components goes here
const Page = () => (
  <>
    <div style={{ color: 'white' }}>Text</div>
  </>
)

// canvas components goes here
// It will receive same props as Page component (from getStaticProps, etc.)
Page.r3f = () => (
  <>
    <Text />
  </>
)

export default Page

export async function getStaticProps() {
  return {
    props: {
      title: 'Text',
      camera: 'orthographic',
    },
  }
}
