/**
 * ViewPersistence — factory for a `{ load, save }` pair that round-trips
 * a DataViews `view` config through `window.localStorage`. SPEC §5.6.
 *
 * Why a factory instead of a hook?
 * Consumers wire their own React state for the view (so they can also
 * apply the {ns}.dashboard.* filters before the first render). The
 * persistence layer is just a thin storage adapter — keeping it
 * framework-free makes it easy to swap for a REST-backed user-meta
 * store later (Site Editor's preference path) without changing the
 * consumer's component code.
 *
 * The Surfaces spike (`tabs/Surfaces/index.js:67-98`) inlined the same
 * load/save pair against `blocksify-spike-surfaces-view`; this factory
 * lifts that pattern into a reusable utility with the same forgiving
 * error handling (storage quota / private-mode failures are silent).
 *
 * Consumer wiring:
 *
 *   import { ViewPersistence } from '@pressmaximum/dashboard-kit/datasets';
 *
 *   const persistence = ViewPersistence.create( {
 *       storageKey: 'customify-templates-view',
 *       defaultView: { type: 'grid', perPage: 20, ... },
 *   } );
 *
 *   const [ view, setView ] = useState( persistence.load );
 *   const handleChangeView = ( next ) => {
 *       setView( next );
 *       persistence.save( next );
 *   };
 *
 * NOTE on DataViews v14.3 mount-normalize (drift finding 6.4): DataViews
 * occasionally fires `onChangeView` ~50ms post-mount that silently demotes
 * `type: 'grid'` → `'table'` even when the persisted view said `'grid'`.
 * Consumers persisting view state should guard the setter so the
 * normalize call is swallowed and the user's saved layout survives:
 *
 *   const mountedAt = useRef( Date.now() );
 *   const lastInteract = useRef( 0 );
 *   useEffect( () => {
 *       const note = () => { lastInteract.current = Date.now(); };
 *       window.addEventListener( 'pointerdown', note, true );
 *       window.addEventListener( 'keydown', note, true );
 *       return () => {
 *           window.removeEventListener( 'pointerdown', note, true );
 *           window.removeEventListener( 'keydown', note, true );
 *       };
 *   }, [] );
 *
 *   const handleChangeView = ( next ) => {
 *       const isMountNormalize =
 *           Date.now() - mountedAt.current < 1500 &&
 *           lastInteract.current < mountedAt.current &&
 *           view?.type === 'grid' &&
 *           next?.type === 'table';
 *       if ( isMountNormalize ) {
 *           return; // swallow; preserve the grid the user persisted
 *       }
 *       setView( next );
 *       persistence.save( next );
 *   };
 *
 * Real user Layout-button clicks fall through via the `lastInteract`
 * check. The 1500ms window is empirical (DataViews v14.3 fires the
 * normalize within ~50ms of mount; the wider gate is forgiving). Kit may
 * ship a `mountNormalizeGuard()` helper in a future minor pending a
 * second consumer use case.
 */

function readStorage() {
	if ( typeof window === 'undefined' || ! window.localStorage ) {
		return null;
	}
	return window.localStorage;
}

/**
 * @param {Object} config
 * @param {string} config.storageKey  localStorage key to read/write under.
 * @param {Object} config.defaultView View shape returned when storage is
 *                                    empty / unreadable / corrupt.
 * @return {{ load: () => Object, save: (next: Object) => void }} Storage
 *         adapter with `load()` + `save(next)` methods.
 */
function create( { storageKey, defaultView } = {} ) {
	if ( ! storageKey ) {
		throw new TypeError(
			'ViewPersistence.create: `storageKey` is required.',
		);
	}
	if ( ! defaultView || typeof defaultView !== 'object' ) {
		throw new TypeError(
			'ViewPersistence.create: `defaultView` must be an object.',
		);
	}

	return {
		load() {
			const storage = readStorage();
			if ( ! storage ) {
				return defaultView;
			}
			try {
				const raw = storage.getItem( storageKey );
				if ( ! raw ) {
					return defaultView;
				}
				const parsed = JSON.parse( raw );
				return parsed && typeof parsed === 'object'
					? { ...defaultView, ...parsed }
					: defaultView;
			} catch ( _ ) {
				// Corrupt JSON or storage read failure — fall back to default
				// rather than surfacing the error to the consumer; the user
				// just sees their stored view forgotten, not a crash.
				return defaultView;
			}
		},
		save( next ) {
			const storage = readStorage();
			if ( ! storage ) {
				return;
			}
			try {
				storage.setItem( storageKey, JSON.stringify( next ) );
			} catch ( _ ) {
				// Quota exceeded, private-browsing mode, or value not
				// serialisable. Persistence is a nice-to-have — never
				// throw out of save().
			}
		},
	};
}

export const ViewPersistence = { create };

export default ViewPersistence;
