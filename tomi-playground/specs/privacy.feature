Feature: Privacy
  Visitors can read how this site is hosted, what Ask Tomi sends, and that the public build has no product analytics.

  Scenario: Privacy is reachable from the shell
    Given I am on the home page
    When I open Privacy from the sidebar
    Then I should see the Privacy heading
    And I should see that the public site does not use advertising cookies or product analytics
    And I should see that the playground is hosted on GitHub Pages
    And I should see that theme, font, and background preferences stay in the browser
    And I should see the Ask Tomi worker host
    And I should see the profile pixel host

  Scenario: Privacy is reachable from Ask Tomi
    Given I am on the Ask Tomi page
    Then I should see that messages go to a Cloudflare Worker
    When I open Privacy from the composer disclosure
    Then I should see the Privacy heading
