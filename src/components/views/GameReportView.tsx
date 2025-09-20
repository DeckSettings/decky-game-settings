import React, { useEffect, useState } from 'react'
import { PanelSection, Focusable, DialogButton, Navigation, Router, showModal } from '@decky/ui'
import ImagePreviewModal from '../elements/ImagePreviewModal'
import ReactMarkdown, { Components } from 'react-markdown'
import { reportsWebsiteBaseUrl } from '../../constants'
import type { ExternalReview, GameReport } from '../../interfaces'
import { gitHubUserProfile, hasToken } from '../../hooks/githubAuth'
import { popupLoginDialog } from '../elements/LoginDialog'
import { makeDraftKey, saveReportFormState } from '../../hooks/githubSubmitReport'
import { ScrollableWindowRelative } from '../elements/ScrollableWindow'
import { MdArrowBack, MdWeb } from 'react-icons/md'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { TbReport } from 'react-icons/tb'

// Type guard to distinguish ExternalReview from GameReport.
export const isExternalReview = (report: GameReport | ExternalReview): report is ExternalReview => {
  return (report as ExternalReview).source !== undefined
}

// Helper to extract YouTube ID from a URL.
export const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match && match[1] ? match[1] : null
}

interface GameReportViewProps {
  gameReport: GameReport | ExternalReview | null
  onGoBack: () => void
  onRequestEdit?: () => void
}

const GameReportView: React.FC<GameReportViewProps> = ({ gameReport, onGoBack, onRequestEdit }) => {
  const [youTubeVideoId, setYouTubeVideoId] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState<boolean>(false)

  // Reset collected images when switching reports
  useEffect(() => {
    setImageUrls([])
  }, [gameReport?.id])

  // Determine if current logged-in user owns this report
  useEffect(() => {
    const checkOwnership = async () => {
      const profile = await gitHubUserProfile()
      if (!profile || !gameReport) {
        setIsOwner(false)
        return
      }
      if (isExternalReview(gameReport)) {
        setIsOwner(profile.login === gameReport.source.name)
      } else {
        setIsOwner(profile.login === gameReport.user.login)
      }
    }
    checkOwnership()
  }, [gameReport])

  const saveDraftFromReport = () => {
    if (!gameReport || isExternalReview(gameReport)) return
    const data = gameReport.data as any
    const key = makeDraftKey(data.game_name, data.app_id)
    // Prefer API-provided GitHub issue number with fallback to parsing html_url. number was only just added
    // TODO: Remove this and only use gameReport.number in future (once remote API cache is gone)
    let issueNumber: number | null = null
    if (typeof (gameReport as any).number === 'number' && Number.isFinite((gameReport as any).number)) {
      issueNumber = (gameReport as any).number as number
    } else if (typeof (gameReport as any).html_url === 'string') {
      const m = (gameReport as any).html_url.match(/\/issues\/(\d+)/)
      if (m && m[1]) {
        const n = Number(m[1])
        issueNumber = Number.isFinite(n) ? n : null
      }
    }
    const draft: Record<string, any> = {
      ...Object.entries(data).reduce((acc: Record<string, any>, [k, v]) => {
        if (v !== null && v !== undefined) acc[k] = v
        return acc
      }, {}),
      __editing_issue_number: issueNumber,
      __editing_issue_title: gameReport.title,
    }
    saveReportFormState(key, draft)
  }

  // Create mapping for react-markdown components with inline styles.
  const markdownComponents: Components = {
    // Ensure h1, h2, h3 headers do not exist
    h1: 'h4',
    h2: 'h4',
    h3: 'h4',
    img(props) {
      const { src } = props as any
      // Collect image URLs and do not render inline
      useEffect(() => {
        if (typeof src === 'string' && src.length > 0) {
          setImageUrls((prev) => (prev.includes(src) ? prev : [...prev, src]))
        }
      }, [src])
      return null
    },
    a(props) {
      const { node, href, title, children, ...rest } = props
      // Enable shields.io filtering here
      const excludeShieldsBadges = false
      // Ensure href exists. We need it for any further functionality. If not, just return basic link
      if (!href) return <a {...rest}>{children}</a>
      // Check if the URL is a YouTube link.
      const isYoutubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(href)
      // Compute videoId synchronously.
      const videoId = isYoutubeLink ? extractYouTubeId(href) : null

      // Convert children to an array and check if any <img> has a shields.io URL.
      const childrenArray = React.Children.toArray(children)
      const containsShieldsBadge = childrenArray.some((child) => {
        if (!excludeShieldsBadges) return false
        if (React.isValidElement(child) && child.type === 'img') {
          const imgSrc = child.props.src
          return typeof imgSrc === 'string' && imgSrc.includes('shields.io')
        }
        return false
      })

      useEffect(() => {
        if (isYoutubeLink && videoId && !containsShieldsBadge) {
          if (videoId !== youTubeVideoId) {
            setYouTubeVideoId(videoId)
          }
        }
      }, [href, isYoutubeLink, videoId, containsShieldsBadge, youTubeVideoId])

      // And immediately return null if it's a YouTube link with no shields badge.
      if (isYoutubeLink && videoId && !containsShieldsBadge) {
        return null
      }

      // Otherwise, render the link normally.
      return (
        <a href={href} title={title} {...rest}>
          {children}
        </a>
      )
    },
  }

  //const allSettings = {
  //    "summary": "SUMMARY",
  //    "game_name": "GAME NAME",
  //    "app_id": "APP ID",
  //    "launcher": "LAUNCHER",
  //    "device_compatibility": "DEVICE COMPATIBILITY",
  //    "target_framerate": "TARGET FRAMERATE",
  //    "device": "DEVICE",
  //    "os_version": "OS VERSION",
  //    "undervolt_applied": "UNDERVOLT APPLIED",
  //    "steam_play_compatibility_tool_used": "STEAM PLAY COMPATIBILITY TOOL USED",
  //    "compatibility_tool_version": "COMPATIBILITY TOOL VERSION",
  //    "custom_launch_options": "CUSTOM LAUNCH OPTIONS",
  //    "frame_limit": "FRAME LIMIT",
  //    "allow_tearing": "ALLOW TEARING",
  //    "half_rate_shading": "HALF RATE SHADING",
  //    "tdp_limit": "TDP LIMIT",
  //    "manual_gpu_clock": "MANUAL GPU CLOCK",
  //    "scaling_mode": "SCALING MODE",
  //    "scaling_filter": "SCALING FILTER",
  //};
  const systemConfiguration = {
    undervolt_applied: 'Undervolt Applied',
    compatibility_tool_version: 'Compatibility Tool Version',
    custom_launch_options: 'Game Launch Options',
  }
  const systemConfigurationData = Object.entries(systemConfiguration)
    .map(([key, formattedKey]) => {
      if (gameReport && gameReport.data && key in gameReport.data && gameReport.data[key] !== null) {
        const value = gameReport.data[key]
        return [formattedKey, String(value)]
      }
      return null
    })
    .filter((entry) => entry !== null) as [string, string][]

  const performanceSettings = {
    frame_limit: 'Frame Limit',
    disable_frame_limit: 'Disable Frame Limit',
    enable_vrr: 'Enable VRR',
    allow_tearing: 'Allow Tearing',
    half_rate_shading: 'Half Rate Shading',
    tdp_limit: 'TDP Limit',
    manual_gpu_clock: 'Manual GPU Clock',
    scaling_mode: 'Scaling Mode',
    scaling_filter: 'Scaling Filter',
  }
  const performanceSettingsData = Object.entries(performanceSettings)
    .map(([key, formattedKey]) => {
      if (gameReport && gameReport.data && key in gameReport.data && gameReport.data[key] !== null) {
        const value = gameReport.data[key]
        return [formattedKey, String(value)]
      }
      return null
    })
    .filter((entry) => entry !== null) as [string, string][]

  const openWeb = (url: string) => {
    Navigation.NavigateToExternalWeb(url)
    Router.CloseSideMenus()
  }

  return (
    <>
      <style>{`
            .game-report {
                padding: 0px 3px;
            }
            .game-report .yt-embed {
                width: 100%;
                max-width: 800px;
                aspect-ratio: 16 / 9;
                border: thin solid;
            }
            .game-report div {
                padding: 0;
            }
            .game-report-section {
                padding: 0px 3px !important;
            }
            .game-report-section-body {
                padding: 0px 7px !important;
                margin-top: 10px;
            }
            .game-report-section-body div {
                padding: 0;
                text-align: left;
            }
            .game-report-section-body h4 {
                font-size: 14px;
                margin: 5px 0;
            }
            .game-report-section-body p {
                font-size: 12px;
                padding: 0;
                margin: 3px 0px;
            }
            .game-report-section-body ul {
                list-style: none;
                font-size: 12px;
                padding: 0;
                margin: 3px 0px;
            }
            .game-report-section-body li {
                display: table;
                text-align: right;
                width: 100%;
                border-bottom: 1px solid #333;
                padding-top: 2px;
                padding-bottom: 2px;
            }
            .game-report-section-body strong {
                display: table-cell;
                text-align: left;
                padding-right: 10px;
                min-width: 100px;
            }
            .game-report-section-body span {
                display: table-cell;
                text-align: left;
                font-size: 12px;
            }
            `}</style>
      <div>
        <div style={{ padding: '3px 16px 3px 16px', margin: 0 }}>
          <Focusable
            style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', height: '26px' }}
            flow-children='horizontal'
          >
            <DialogButton
              // @ts-ignore
              autoFocus={true}
              retainFocus={true}
              style={{
                width: '73px',
                minWidth: '73px',
                padding: '3px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
              onClick={onGoBack}
            >
              <MdArrowBack />
            </DialogButton>
            <DialogButton
              style={{
                width: '70%',
                minWidth: 0,
                padding: '3px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
              onClick={() => {
                if (gameReport) {
                  if (isExternalReview(gameReport)) {
                    openWeb(gameReport.html_url)
                  } else {
                    if (gameReport.data.app_id) {
                      openWeb(`${reportsWebsiteBaseUrl}/app/${gameReport.data.app_id}?expandedId=${gameReport.id}`)
                    } else {
                      openWeb(`${reportsWebsiteBaseUrl}/game/${gameReport.data.game_name}?expandedId=${gameReport.id}`)
                    }
                  }
                }
              }}
            >
              <MdWeb /> Open in browser
            </DialogButton>
          </Focusable>
        </div>
        <hr />

        {gameReport && !isExternalReview(gameReport) && isOwner && (
          <>
            <div
              style={{
                margin: 0,
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '3px',
                paddingBottom: '3px',
                overflow: 'hidden',
              }}
            >
              <DialogButton
                style={{
                  width: '100%',
                  minWidth: 0,
                  padding: '3px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  gap: '1rem',
                }}
                onClick={() => {
                  const proceed = () => {
                    saveDraftFromReport()
                    if (onRequestEdit) onRequestEdit()
                  }
                  if (hasToken()) {
                    proceed()
                  } else {
                    popupLoginDialog(() => {
                      // If login succeeded and user closes the dialog, proceed
                      if (hasToken()) proceed()
                    })
                  }
                }}
              >
                <TbReport fill='#FF5E5E' />
                Edit this report
              </DialogButton>
            </div>
            <hr />
          </>
        )}
      </div>

      <Focusable
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '-webkit-fill-available',
          width: '-webkit-fill-available',
          position: 'absolute',
        }}
      >
        <ScrollableWindowRelative>
          <>
            {gameReport && (
              <div
                className='game-report'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'right',
                  margin: '10px',
                }}
              >
                {isExternalReview(gameReport) ? (
                  <>
                    <img
                      src={gameReport.source.avatar_url}
                      alt='Source Avatar'
                      style={{ height: '18px', marginLeft: '3px' }}
                    />
                    <span
                      style={{
                        padding: '0 0 3px 3px',
                        margin: 0,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        lineHeight: '16px',
                      }}
                    >
                      {gameReport.source.name}
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={gameReport.user.avatar_url}
                      alt='User Avatar'
                      style={{ height: '18px', marginLeft: '3px' }}
                    />
                    <span
                      style={{
                        padding: '0 0 3px 3px',
                        margin: 0,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        lineHeight: '16px',
                      }}
                    >
                      {gameReport.user.login}
                    </span>
                  </>
                )}
              </div>
            )}

            {youTubeVideoId && (
              <div
                className='game-report'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'right',
                  margin: '10px',
                }}
              >
                <iframe
                  className='yt-embed'
                  src={`https://www.youtube.com/embed/${youTubeVideoId}?fs=0&controls=0`}
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen={false}
                >
                  {`Loading embedded YT player for link https://youtu.be/${youTubeVideoId}`}
                </iframe>
              </div>
            )}

            {systemConfigurationData && systemConfigurationData.length > 0 && (
              <div className='game-report-section'>
                <PanelSection title='System Configuration'>
                  <div className='game-report-section-body'>
                    <ul>
                      {systemConfigurationData.map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}</strong>
                          {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PanelSection>
                <hr />
              </div>
            )}

            {performanceSettingsData && performanceSettingsData.length > 0 && (
              <div className='game-report-section'>
                <PanelSection title='Performance Settings'>
                  <div className='game-report-section-body'>
                    <ul>
                      {performanceSettingsData.map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}</strong>
                          {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PanelSection>
                <hr />
              </div>
            )}

            {gameReport && gameReport.data.game_display_settings && (
              <div className='game-report-section'>
                <PanelSection title='Game Display Settings'>
                  <div className='game-report-section-body'>
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
                      {gameReport.data.game_display_settings || ''}
                    </ReactMarkdown>
                  </div>
                </PanelSection>
                <hr />
              </div>
            )}

            {gameReport && gameReport.data.game_graphics_settings && (
              <div className='game-report-section'>
                <PanelSection title='Game Graphics Settings'>
                  <div className='game-report-section-body'>
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
                      {gameReport.data.game_graphics_settings || ''}
                    </ReactMarkdown>
                  </div>
                </PanelSection>
                <hr />
              </div>
            )}

            {gameReport && gameReport.data.additional_notes && (
              <div className='game-report-section'>
                <PanelSection title='Additional Notes'>
                  <div className='game-report-section-body'>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={markdownComponents}
                    >
                      {gameReport.data.additional_notes || ''}
                    </ReactMarkdown>
                  </div>
                </PanelSection>
                <hr />
              </div>
            )}

            {imageUrls && imageUrls.length > 0 && (
              <div>
                {imageUrls.map((url) => (
                  <button
                    key={url}
                    style={{
                      padding: 0,
                      margin: 0,
                      background: 'transparent',
                      border: 'none',
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      try {
                        showModal(<ImagePreviewModal src={url} alt={'Image'} />)
                      } catch {}
                    }}
                  >
                    <img
                      src={url}
                      alt='Image'
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        height: 'auto',
                        border: '1px solid #444',
                        marginTop: '10px',
                        marginBottom: '10px',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        </ScrollableWindowRelative>
      </Focusable>
    </>
  )
}

export default GameReportView
