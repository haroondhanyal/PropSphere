Feature: PropSphere marketplace and administration
  Scenario: A buyer opens the sale marketplace
    Given a buyer selects Buy
    When sale listings finish loading
    Then the sale filter remains selected and results are visible

  Scenario: A tenant searches for a rental apartment
    Given a tenant selects Rent and Apartment
    When the search is submitted
    Then rental results are visible

  Scenario: A visitor adjusts advanced search criteria
    Given a visitor opens the filters panel
    When budget and area values are entered
    Then the selected criteria remain visible

  Scenario: A visitor narrows listings to Islamabad
    Given a visitor enters Islamabad as the city
    When search results load
    Then the city filter remains selected

  Scenario: A new customer chooses an account type
    Given a customer opens account registration
    When Tenant is selected
    Then the Tenant option is checked

  Scenario: An administrator uses the sign-in entry
    Given a visitor opens customer sign-in
    When Admin sign-in is selected
    Then the secure administrator portal is shown

  Scenario: A guest requests the workspace
    Given a guest opens a protected workspace route
    When no session is active
    Then the guest is sent to sign-in

  Scenario: An administrator opens listing review
    Given an administrator is signed in
    When they select Listing review
    Then the listing review queue is displayed
