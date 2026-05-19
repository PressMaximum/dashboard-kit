<?php
/**
 * SchemaBuilder — fluent declaration → defaults / schema payload /
 * sanitize coercion. Pure-logic tests, no WP stubs touched beyond
 * `sanitize_text_field` for text-field coercion.
 *
 * @package PressMaximum\DashboardKit\Tests
 */

declare(strict_types=1);

namespace PressMaximum\DashboardKit\Tests;

use PHPUnit\Framework\TestCase;
use PressMaximum\DashboardKit\Schema\SchemaBuilder;

final class SchemaBuilderTest extends TestCase {

	protected function setUp(): void {
		pmdk_test_reset();
	}

	/* ---------------- buildDefaults() ---------------- */

	public function test_build_defaults_returns_group_keyed_shape(): void {
		$builder = SchemaBuilder::create()
			->panel( 'performance', 'Performance' )
			->booleanField( 'per_block_assets', 'Load assets per block', true )
			->booleanField( 'disable_cache', 'Disable cache', false )
			->endPanel()
			->panel( 'version', 'Version control' )
			->selectField(
				'channel',
				'Update channel',
				'stable',
				array(
					'stable' => 'Stable',
					'beta'   => 'Beta',
				)
			);

		$this->assertSame(
			array(
				'performance' => array(
					'per_block_assets' => true,
					'disable_cache'    => false,
				),
				'version'     => array(
					'channel' => 'stable',
				),
			),
			$builder->buildDefaults()
		);
	}

	public function test_build_defaults_empty_when_no_panels(): void {
		$this->assertSame( array(), SchemaBuilder::create()->buildDefaults() );
	}

	/* ---------------- buildSchema() ---------------- */

	public function test_build_schema_returns_panels_array_with_field_descriptors(): void {
		$schema = SchemaBuilder::create()
			->panel( 'performance', 'Performance' )
			->description( 'Asset delivery.' )
			->booleanField( 'cache', 'Enable cache', true, array( 'description' => 'Keep CSS cached.' ) )
			->selectField(
				'mode',
				'CSS mode',
				'inline',
				array(
					'inline'   => 'Inline',
					'external' => 'External',
				)
			)
			->numberField( 'ttl', 'TTL (s)', 60, array( 'min' => 0, 'max' => 3600 ) )
			->buildSchema();

		$this->assertArrayHasKey( 'panels', $schema );
		$this->assertCount( 1, $schema['panels'] );

		$panel = $schema['panels'][0];
		$this->assertSame( 'performance', $panel['id'] );
		$this->assertSame( 'Performance', $panel['label'] );
		$this->assertSame( 'Asset delivery.', $panel['description'] );
		$this->assertCount( 3, $panel['fields'] );

		$this->assertSame(
			array(
				'id'          => 'cache',
				'label'       => 'Enable cache',
				'type'        => 'boolean',
				'default'     => true,
				'description' => 'Keep CSS cached.',
			),
			$panel['fields'][0]
		);

		$this->assertSame(
			array(
				array( 'value' => 'inline', 'label' => 'Inline' ),
				array( 'value' => 'external', 'label' => 'External' ),
			),
			$panel['fields'][1]['options']
		);

		$this->assertSame( 0.0, $panel['fields'][2]['min'] );
		$this->assertSame( 3600.0, $panel['fields'][2]['max'] );
	}

	public function test_re_opening_a_panel_merges_more_fields(): void {
		$builder = SchemaBuilder::create()
			->panel( 'performance', 'Performance' )
			->booleanField( 'cache', 'Cache', true )
			->endPanel()
			->panel( 'performance', 'Performance' )
			->booleanField( 'preload', 'Preload', false );

		$schema = $builder->buildSchema();
		$this->assertCount( 1, $schema['panels'] );
		$this->assertCount( 2, $schema['panels'][0]['fields'] );
	}

	/* ---------------- sanitize() ---------------- */

	public function test_sanitize_coerces_booleans(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->booleanField( 'flag', 'Flag', false );

		$out = $builder->sanitize( array( 'g' => array( 'flag' => 'truthy-string' ) ) );
		$this->assertSame( true, $out['g']['flag'] );

		$out = $builder->sanitize( array( 'g' => array( 'flag' => 0 ) ) );
		$this->assertSame( false, $out['g']['flag'] );
	}

	public function test_sanitize_whitelists_select_enum(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->selectField(
				'mode',
				'Mode',
				'a',
				array(
					'a' => 'A',
					'b' => 'B',
				)
			);

		$out = $builder->sanitize( array( 'g' => array( 'mode' => 'b' ) ) );
		$this->assertSame( 'b', $out['g']['mode'] );

		// Invalid → falls back to default.
		$out = $builder->sanitize( array( 'g' => array( 'mode' => 'evil' ) ) );
		$this->assertSame( 'a', $out['g']['mode'] );
	}

	public function test_sanitize_clamps_number_to_min_max(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->numberField( 'n', 'N', 5, array( 'min' => 0, 'max' => 10 ) );

		$this->assertSame( 0.0, $builder->sanitize( array( 'g' => array( 'n' => -100 ) ) )['g']['n'] );
		$this->assertSame( 10.0, $builder->sanitize( array( 'g' => array( 'n' => 999 ) ) )['g']['n'] );
		$this->assertSame( 5.0, $builder->sanitize( array( 'g' => array( 'n' => 5 ) ) )['g']['n'] );
	}

	public function test_sanitize_falls_back_to_default_when_number_not_numeric(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->numberField( 'n', 'N', 7 );

		$out = $builder->sanitize( array( 'g' => array( 'n' => 'not a number' ) ) );
		$this->assertSame( 7.0, $out['g']['n'] );
	}

	public function test_sanitize_drops_unknown_fields_and_fills_missing_with_defaults(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->booleanField( 'real', 'Real', true );

		$out = $builder->sanitize(
			array(
				'g' => array(
					'real'   => false,
					'bogus'  => 'hax',
				),
				'unrelated_group' => array( 'x' => 'y' ),
			)
		);
		$this->assertSame( array( 'g' => array( 'real' => false ) ), $out );
	}

	public function test_sanitize_text_uses_sanitize_text_field(): void {
		$builder = SchemaBuilder::create()
			->panel( 'g', 'Group' )
			->textField( 't', 'T', 'fallback' );

		$out = $builder->sanitize(
			array( 'g' => array( 't' => "  hello <script>evil()</script>  " ) )
		);
		$this->assertSame( 'hello evil()', $out['g']['t'] );
	}

	/* ---------------- defensive errors ---------------- */

	public function test_field_outside_a_panel_throws(): void {
		$this->expectException( \LogicException::class );
		SchemaBuilder::create()->booleanField( 'no_panel', 'Label', true );
	}

	public function test_panel_with_empty_id_throws(): void {
		$this->expectException( \InvalidArgumentException::class );
		SchemaBuilder::create()->panel( '', 'Label' );
	}
}
