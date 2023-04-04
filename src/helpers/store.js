import create from 'zustand'

const useStore = create(() => ({
  router: null,
  dom: null,
  viewAudioViz: false,
  stopPlaying: false,
}))

export default useStore
