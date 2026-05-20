<?php
/**
 * Schema builder — fluent API for declaring the settings shape that
 * powers {@see \PressMaximum\DashboardKit\REST\SettingsControllerBase}.
 *
 * One declaration produces three artifacts:
 *   - {@see buildDefaults()} → `{ group: { field: default } }` shape that
 *                              merges over saved values on read.
 *   - {@see buildSchema()}    → `{ panels: [...] }` payload served by the
 *                              schema-GET endpoint + consumed by the JS
 *                              `<SchemaForm>` renderer (SPEC §5.4).
 *   - {@see sanitize($body)}  → coerce + validate an incoming POST body
 *                              against the declared field types. Drops
 *                              unknown keys, whitelists enums, coerces
 *                              booleans / numbers, falls back to the
 *                              field default when invalid.
 *
 * Ported from the spike's `Blocksify_Dashboard_Schema` static class with
 * the same coercion semantics (`class-blocksify-dashboard-schema.php`
 * lines 199-273) — promoted to a fluent builder so consumers can declare
 * their schema in one expression instead of three parallel static
 * arrays.
 *
 * SPEC §5.10 + §5.4.
 *
 * @package PressMaximum\DashboardKit\Schema
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Schema;

if ( ! defined( 'ABSPATH' ) && ! defined( 'PMDK_TESTING' ) ) {
	exit;
}

/**
 * Fluent builder. Call `SchemaBuilder::create()` to start.
 */
final class SchemaBuilder {

	/**
	 * @var array<string, array<string, mixed>> Panel state keyed by panel id.
	 */
	private $panels = array();

	/**
	 * @var string|null Currently-open panel id (between `panel()` +
	 *                  `endPanel()`).
	 */
	private $currentPanel = null;

	/**
	 * Private — construct via {@see create()}.
	 */
	private function __construct() {
	}

	/**
	 * Start a new schema. Each call returns a fresh builder.
	 */
	public static function create(): self {
		return new self();
	}

	/**
	 * Open a panel. Subsequent field calls attach to it until
	 * `endPanel()` (or the next `panel()`) closes it. Re-opening a panel
	 * by the same id merges further fields into the existing panel — Pro
	 * plugins extending Free can amend a panel this way.
	 *
	 * @param string $id    Panel id (settings group key).
	 * @param string $label Translatable label.
	 */
	public function panel( string $id, string $label ): self {
		if ( '' === $id ) {
			throw new \InvalidArgumentException( 'panel(): id cannot be empty.' );
		}
		if ( ! isset( $this->panels[ $id ] ) ) {
			$this->panels[ $id ] = array(
				'id'     => $id,
				'label'  => $label,
				'fields' => array(),
			);
		} else {
			// Re-opened panel — refresh label if caller provided one.
			$this->panels[ $id ]['label'] = $label;
		}
		$this->currentPanel = $id;
		return $this;
	}

	/**
	 * Attach a description to the currently-open panel.
	 */
	public function description( string $description ): self {
		$this->panels[ $this->requireOpenPanel() ]['description'] = $description;
		return $this;
	}

	/**
	 * Close the currently-open panel. Optional — calling `panel()` again
	 * implicitly closes the previous one.
	 */
	public function endPanel(): self {
		$this->currentPanel = null;
		return $this;
	}

	/**
	 * Declare a boolean field.
	 *
	 * @param string $id      Field id (group sub-key).
	 * @param string $label   Translatable label.
	 * @param bool   $default Default value.
	 * @param array<string, mixed> $extra Optional `description` etc.
	 */
	public function booleanField( string $id, string $label, bool $default, array $extra = array() ): self {
		return $this->addField( 'boolean', $id, $label, $default, $extra );
	}

	/**
	 * Declare a select field with an enum of options.
	 *
	 * Accepts two `$options` shapes:
	 *
	 *   - Map (preferred, terser):  `[ 'v1' => 'Version 1', 'v2' => 'Version 2' ]`
	 *   - Shaped array (verbose):   `[ ['value' => 'v1', 'label' => 'Version 1'], ... ]`
	 *
	 * Both produce the same `{value, label}[]` schema entry. KIT_ISSUES K-008
	 * — earlier versions silently coerced the shaped form to literal `"Array"`
	 * + raised `Array to string conversion` warnings.
	 *
	 * @param string $id      Field id.
	 * @param string $label   Translatable label.
	 * @param string $default Default option value (must appear in `$options`).
	 * @param array  $options Either a `value => label` map OR an array of
	 *                        `['value' => ..., 'label' => ...]` entries.
	 * @param array  $extra   Optional `description` etc.
	 */
	public function selectField( string $id, string $label, string $default, array $options, array $extra = array() ): self {
		$extra['options'] = self::normalizeOptions( $options );
		return $this->addField( 'select', $id, $label, $default, $extra );
	}

	/**
	 * Declare a radio field (same shape as `select` but rendered as
	 * radio buttons). Accepts the same two `$options` shapes — see
	 * {@see selectField()} for the contract.
	 *
	 * @param string $id      Field id.
	 * @param string $label   Translatable label.
	 * @param string $default Default option value.
	 * @param array  $options Either a `value => label` map OR an array of
	 *                        `['value' => ..., 'label' => ...]` entries.
	 * @param array  $extra   Optional `description` etc.
	 */
	public function radioField( string $id, string $label, string $default, array $options, array $extra = array() ): self {
		$extra['options'] = self::normalizeOptions( $options );
		return $this->addField( 'radio', $id, $label, $default, $extra );
	}

	/**
	 * Coerce either input shape into the canonical `{value, label}[]`
	 * array the SchemaField JSX dispatch expects.
	 *
	 * @param array<int|string, mixed> $options Caller's options array.
	 * @return array<int, array{value: string, label: string}>
	 */
	private static function normalizeOptions( array $options ): array {
		$shaped = array();
		foreach ( $options as $value => $optionLabel ) {
			// Already-shaped entry: `[ 'value' => ..., 'label' => ... ]`.
			// Pass through so consumers can mix the verbose form alongside
			// the map form without hitting the `(string) $array` coerce.
			if ( is_array( $optionLabel ) && isset( $optionLabel['value'], $optionLabel['label'] ) ) {
				$shaped[] = array(
					'value' => (string) $optionLabel['value'],
					'label' => (string) $optionLabel['label'],
				);
				continue;
			}
			$shaped[] = array(
				'value' => (string) $value,
				'label' => (string) $optionLabel,
			);
		}
		return $shaped;
	}

	/**
	 * Declare a number field with optional min / max / step.
	 *
	 * @param string                $id      Field id.
	 * @param string                $label   Translatable label.
	 * @param float|int             $default Default value.
	 * @param array<string, mixed>  $extra   Optional `min`, `max`, `step`,
	 *                                       `description`.
	 */
	public function numberField( string $id, string $label, $default, array $extra = array() ): self {
		return $this->addField( 'number', $id, $label, (float) $default, $extra );
	}

	/**
	 * Declare a free-form text field. Sanitised via
	 * `sanitize_text_field()` on save.
	 *
	 * @param string $id      Field id.
	 * @param string $label   Translatable label.
	 * @param string $default Default value.
	 * @param array<string, mixed> $extra Optional `description`,
	 *                                    `maxLength`, `pattern`.
	 */
	public function textField( string $id, string $label, string $default, array $extra = array() ): self {
		return $this->addField( 'text', $id, $label, $default, $extra );
	}

	/**
	 * Return `{ panel_id => { field_id => default } }` defaults shape
	 * suitable for `SettingsControllerBase::getDefaults()`.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function buildDefaults(): array {
		$out = array();
		foreach ( $this->panels as $id => $panel ) {
			$out[ $id ] = array();
			foreach ( $panel['fields'] as $field ) {
				$out[ $id ][ $field['id'] ] = $field['default'];
			}
		}
		return $out;
	}

	/**
	 * Return `{ panels: [...] }` payload for the schema-GET endpoint /
	 * `<SchemaForm>` consumer.
	 *
	 * @return array{panels: array<int, array<string, mixed>>}
	 */
	public function buildSchema(): array {
		$panels = array();
		foreach ( $this->panels as $panel ) {
			$shapedFields = array();
			foreach ( $panel['fields'] as $field ) {
				$entry = array(
					'id'      => $field['id'],
					'label'   => $field['label'],
					'type'    => $field['type'],
					'default' => $field['default'],
				);
				foreach ( array( 'description', 'options', 'min', 'max', 'step', 'pattern', 'maxLength' ) as $extra ) {
					if ( array_key_exists( $extra, $field ) ) {
						$entry[ $extra ] = $field[ $extra ];
					}
				}
				$shapedFields[] = $entry;
			}
			$panelOut = array(
				'id'     => $panel['id'],
				'label'  => $panel['label'],
				'fields' => $shapedFields,
			);
			if ( isset( $panel['description'] ) ) {
				$panelOut['description'] = $panel['description'];
			}
			$panels[] = $panelOut;
		}
		return array( 'panels' => $panels );
	}

	/**
	 * Coerce + validate an incoming POST body against the declared field
	 * types. Unknown keys dropped, enums whitelisted, bools / numbers
	 * coerced, invalid values fall back to the field default.
	 *
	 * @param array<string, mixed> $incoming Raw body.
	 * @return array<string, mixed> Sanitized shape (same keys as defaults).
	 */
	public function sanitize( array $incoming ): array {
		$out = array();
		foreach ( $this->panels as $panelId => $panel ) {
			$panelIn      = isset( $incoming[ $panelId ] ) && is_array( $incoming[ $panelId ] )
				? $incoming[ $panelId ]
				: array();
			$out[ $panelId ] = array();
			foreach ( $panel['fields'] as $field ) {
				$fieldId          = $field['id'];
				$raw              = array_key_exists( $fieldId, $panelIn )
					? $panelIn[ $fieldId ]
					: $field['default'];
				$out[ $panelId ][ $fieldId ] = self::coerce( $raw, $field );
			}
		}
		return $out;
	}

	/**
	 * Coerce a single value to the field's declared type. Falls back to
	 * the field default when the value can't be represented.
	 *
	 * @param mixed                $value Raw value.
	 * @param array<string, mixed> $field Field descriptor.
	 *
	 * @return mixed
	 */
	private static function coerce( $value, array $field ) {
		$type    = $field['type'];
		$default = $field['default'];

		switch ( $type ) {
			case 'boolean':
				return (bool) $value;

			case 'select':
			case 'radio':
				$allowed = array();
				if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
					foreach ( $field['options'] as $option ) {
						if ( isset( $option['value'] ) ) {
							$allowed[] = $option['value'];
						}
					}
				}
				return in_array( $value, $allowed, true ) ? $value : $default;

			case 'number':
				if ( ! is_numeric( $value ) ) {
					return $default;
				}
				$num = (float) $value;
				if ( isset( $field['min'] ) && $num < (float) $field['min'] ) {
					$num = (float) $field['min'];
				}
				if ( isset( $field['max'] ) && $num > (float) $field['max'] ) {
					$num = (float) $field['max'];
				}
				return $num;

			case 'text':
			default:
				if ( ! is_string( $value ) ) {
					return (string) $default;
				}
				return function_exists( 'sanitize_text_field' )
					? \sanitize_text_field( $value )
					: $value;
		}
	}

	/**
	 * Shared helper for typed field declarations.
	 *
	 * @param string               $type    Field type tag.
	 * @param string               $id      Field id.
	 * @param string               $label   Translatable label.
	 * @param mixed                $default Default value.
	 * @param array<string, mixed> $extra   Additional descriptor keys.
	 */
	private function addField( string $type, string $id, string $label, $default, array $extra ): self {
		if ( '' === $id ) {
			throw new \InvalidArgumentException( 'addField(): id cannot be empty.' );
		}
		$panelId = $this->requireOpenPanel();
		$field   = array(
			'id'      => $id,
			'label'   => $label,
			'type'    => $type,
			'default' => $default,
		);
		foreach ( $extra as $k => $v ) {
			$field[ $k ] = $v;
		}
		$this->panels[ $panelId ]['fields'][] = $field;
		return $this;
	}

	/**
	 * Return the open-panel id or throw if none is open.
	 */
	private function requireOpenPanel(): string {
		if ( null === $this->currentPanel ) {
			throw new \LogicException( 'Open a panel via panel( $id, $label ) before adding fields.' );
		}
		return $this->currentPanel;
	}
}
