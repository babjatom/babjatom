Feature: Fonts
  Visitors can switch typeface presets from the shell. The choice is remembered in this browser and stays when they change color themes.

  Scenario: Visitor selects a font preset
    Given I am on the home page
    When I select the Classic font
    Then the playground should use the Classic font
    And that font choice should be remembered in this browser

  Scenario: Default font when nothing is remembered
    Given I have no remembered font
    When I open the playground
    Then the Exo 2 font should be active
    And several techno font presets should be available

  Scenario: Font choice survives a theme change
    Given I am on the home page
    And I have selected the Classic font
    When I select the Ink Night theme
    Then the playground should still use the Classic font

  Scenario: Theme Playground shows typography for the active font
    Given I am on the Theme Playground page
    When I select the Classic font
    Then I should see a typography sample for the Classic font
