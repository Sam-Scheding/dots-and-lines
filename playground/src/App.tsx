import { useSyncExternalStore } from 'react';

import styles from './App.module.css';
import { examples } from './examples';

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;
const getServerHash = () => '';

export function App() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const id = hash.replace(/^#\/?/, '');
  const example = examples.find((candidate) => candidate.id === id);

  if (!example) {
    return (
      <main className={styles.page}>
        <h1>dots-and-lines examples</h1>
        <p className={styles.description}>
          Each example shows one thing. The code is in{' '}
          <code>playground/src/examples/</code>.
        </p>
        <ul className={styles.list}>
          {examples.map((entry) => (
            <li key={entry.id}>
              <a href={`#/${entry.id}`}>{entry.title}</a>
              <span className={styles.listDescription}>
                {entry.description}
              </span>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <a className={styles.back} href="#/">
        ← All examples
      </a>
      <h1>{example.title}</h1>
      <p className={styles.description}>{example.description}</p>
      <example.Component key={example.id} />
    </main>
  );
}
