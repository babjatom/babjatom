Feature: Themes
  Visitors can switch CSS-variable themes from Theme Playground. The choice is remembered in this browser.

  Scenario: Visitor selects a preset theme
    Given I am on the Theme Playground page
    When I select the Ink Night theme
    Then the playground should use the Ink Night theme
    And that choice should be remembered in this browser

  Scenario: Visitor generates a random theme
    Given I am on the Theme Playground page
    When I generate a random theme
    Then the playground should use that generated theme
    And that theme should be remembered in this browser

  Scenario: Default theme when nothing is remembered
    Given I have no remembered theme
    When I open the playground
    Then the default preset theme should be active
    And at least three preset themes should be available
