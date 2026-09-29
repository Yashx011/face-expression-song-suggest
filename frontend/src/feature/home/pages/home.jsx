import React from 'react'
import FaceExpression from '../../Expression/components/faceExpression'
import Player from '../components/player'
import { useSong } from '../hooks/useSong'

const Home = () => {
  const { handleGetSong } = useSong()

  return (
    <>
      <FaceExpression onExpressionDetected={handleGetSong} />
      <Player />
    </>
  )
}

export default Home
