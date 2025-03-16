import React, { useEffect, useState } from 'react'
import { fetchNoCors } from '@decky/api'
import { getPluginConfig } from '../../constants'

const pluginName = __PLUGIN_NAME__
const pluginVersion = __PLUGIN_VERSION__

const fetchAvatarImage = async (): Promise<string | null> => {
  try {
    const config = getPluginConfig()
    const cb = Math.floor(Date.now() / (10 * 60 * 1000))
    let url = `https://deckverified.games/deck-verified/api/v1/images/plugin/${pluginName}/avatar.jpg?cb=${cb}`
    if (config.installationId) {
      url += `&id=${encodeURIComponent(config.installationId)}`
    }
    if (pluginVersion) {
      url += `&v=${encodeURIComponent(pluginVersion)}`
    }
    const res = await fetchNoCors(url, { method: 'GET' })
    if (!res.ok) {
      console.error('Failed to fetch avatar image')
      return null
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error fetching avatar image:', error)
    return null
  }
}

export const Footer: React.FC = () => {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)

  useEffect(() => {
    const loadAvatar = async () => {
      const imageUrl = await fetchAvatarImage()
      if (imageUrl) setAvatarSrc(imageUrl)
    }
    loadAvatar()

    return () => {
      if (avatarSrc) URL.revokeObjectURL(avatarSrc)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '100%',
        backgroundColor: '#0e141b',
        padding: '5px 0',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'black',
          color: 'white',
          borderRadius: '15px',
          fontSize: '0.6rem',
          fontFamily: 'Arial, sans-serif',
          marginRight: '5px',
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Avatar"
            style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              marginLeft: '2px',
            }}
          />
        ) : (
          <div
            style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              marginLeft: '2px',
            }}
          ></div>
        )}
        <div style={{ display: 'inline', padding: '5px' }}>
          This plugin was brought to you by Josh.5
        </div>
      </div>
    </div>
  )
}
