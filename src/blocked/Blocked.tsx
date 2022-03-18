import React from 'react'
import { useSearchParam } from 'react-use'

import { Footer } from 'components/Footer/Footer'
import styles from './Blocked.module.css'

// TODO: don't add link to host if isUrlBlocked
// TODO: different message for pathname block vs host block
// (requires async block engine initialization)

export const Blocked = () => {
  const host = useSearchParam('host')

  return (
    <div className={styles.container}>
      <div className={styles.header} />

      <div className={styles.body}>
        <h1 className={styles.title}>Blocked</h1>

        <p>
          You blocked this page
          {host && (
            <>
              {' '}
              on{' '}
              <a href={`https://${host}`} className={styles.ban}>
                {host}
              </a>
            </>
          )}
          . It&apos;s probably there for a good reason.
        </p>
      </div>

      <Footer />
    </div>
  )
}
