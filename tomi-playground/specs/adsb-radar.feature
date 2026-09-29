Feature: ADS-B radar
  Visitors can open a live ADS-B radar from the pages menu and expand it
  to the full receiver site.

  Scenario: Visitor opens ADS-B radar
    Given I am on the home page
    When I open ADS-B radar from the pages menu
    Then I should see the ADS-B radar heading
    And I should see a short explanation of ADS-B
    And I should see the live adsb.tomibabjak.dev radar
    And I should see a Fullscreen button
    And Fullscreen should open adsb.tomibabjak.dev in a new tab
