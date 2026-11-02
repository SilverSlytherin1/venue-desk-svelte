import { useTheme } from '../support/theme';

const PROBLEM_JSON = { 'content-type': 'application/problem+json' };

describe('Booking seats', () => {
  const eventId = '0b1f7c1e-6f0a-4d58-9d7b-2f1c6a4e9a01';
  const eventPath = `/api/v1/events/${eventId}`;
  const bookingsPath = `${eventPath}/bookings`;
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  function fillInBooking(seats: number): void {
    cy.findByRole('textbox', { name: 'Full name' }).type('Lena Varga');
    cy.findByRole('textbox', { name: 'Email' }).type('lena@example.com');
    cy.findByRole('spinbutton', { name: 'Seats' }).type(`{selectall}${seats}`);
  }

  beforeEach(() => {
    useTheme('light');
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, { fixture: 'events.json' });
    cy.intercept('GET', eventPath, { fixture: 'event.json' });
  });

  it('books seats for an event and shows the booking the API returned', () => {
    cy.intercept('POST', bookingsPath, { statusCode: 201, fixture: 'booking.json' }).as('booking');

    cy.visit('/');
    cy.findByRole('link', { name: 'Jazz Night with the Blue Quartet' }).click();
    // Navigation moves focus to the new page's heading, which is what a screen reader announces.
    cy.findByRole('heading', { level: 1, name: 'Jazz Night with the Blue Quartet' }).should(
      'have.focus',
    );

    fillInBooking(2);
    cy.viewport(1280, 1040);
    cy.scrollTo('top');
    cy.screenshot('readme-event-detail', { capture: 'viewport', overwrite: true });
    cy.viewport(1280, 800);
    cy.findByRole('button', { name: 'Book seats' }).click();

    cy.wait('@booking').then(({ request }) => {
      expect(request.body).to.deep.equal({
        name: 'Lena Varga',
        email: 'lena@example.com',
        seats: 2,
      });
      expect(request.headers['idempotency-key']).to.match(UUID_V4);
    });
    cy.location('pathname').should('match', /\/booked$/);
    cy.findByRole('heading', { level: 1, name: 'Booking confirmed' }).should('have.focus');
    cy.findByText('VD-7K2Q9X').should('be.visible');
    cy.findByText('2 seats booked for Lena Varga (lena@example.com).').should('be.visible');
    // What happens next comes from the messages the API scheduled for this booking.
    cy.findByRole('region', { name: 'What happens next' })
      .findAllByRole('heading', { level: 3 })
      .then((steps) => {
        expect([...steps].map((step) => step.textContent.trim())).to.deep.equal([
          'Confirmation sent',
          'Reminder on Wed 13 Nov',
          'Feedback request on Fri 15 Nov',
        ]);
      });
    cy.screenshot('readme-booking-confirmed', { capture: 'viewport', overwrite: true });

    // The booking travels in the history entry, so it survives a reload, and another one. Typing
    // the address carries no booking, and the page does not pretend otherwise.
    cy.reload();
    cy.findByText('VD-7K2Q9X').should('be.visible');
    cy.reload();
    cy.findByText('VD-7K2Q9X').should('be.visible');
    cy.visit('/');
    cy.visit(`/events/${eventId}/booked`);
    cy.location('pathname').should('not.include', '/booked');
    cy.findByRole('button', { name: 'Book seats' }).should('exist');
  });

  it('explains a sell-out and shows the seats that are really left', () => {
    cy.intercept('POST', bookingsPath, {
      statusCode: 409,
      headers: PROBLEM_JSON,
      fixture: 'problem-event-sold-out.json',
    }).as('booking');

    cy.visit(`/events/${eventId}`);
    cy.findByText('82 seats left of 120').should('be.visible');
    fillInBooking(3);

    // Someone else books in the meantime: from now on the API reports a single seat.
    cy.fixture('event.json').then((event: Record<string, unknown>) => {
      cy.intercept('GET', eventPath, { ...event, seatsTaken: 119, seatsLeft: 1 }).as('refresh');
    });
    cy.findByRole('button', { name: 'Book seats' }).click();

    cy.wait(['@booking', '@refresh']);
    cy.findByRole('alert').should('contain.text', 'only 1 seat left');
    cy.findByText('1 seat left of 120').should('be.visible');
    cy.findByRole('textbox', { name: 'Full name' }).should('have.value', 'Lena Varga');
    cy.location('pathname').should('not.include', '/booked');
  });

  it('offers "Try again" when the outcome is unknown, and replays the same key', () => {
    cy.intercept('POST', bookingsPath, { forceNetworkError: true }).as('lost');

    cy.visit(`/events/${eventId}`);
    fillInBooking(2);
    cy.findByRole('button', { name: 'Book seats' }).click();
    cy.wait('@lost').then(({ request }) => {
      const key = request.headers['idempotency-key'];

      cy.findByRole('alert').should('contain.text', 'Trying again is safe');
      cy.intercept('POST', bookingsPath, { statusCode: 201, fixture: 'booking.json' }).as('retry');
      cy.findByRole('button', { name: 'Try again' }).click();

      cy.wait('@retry').its('request.headers.idempotency-key').should('equal', key);
    });
    cy.findByRole('heading', { level: 1, name: 'Booking confirmed' }).should('be.visible');
  });
});

describe('Home', () => {
  it('lists the upcoming events with the seats left, in the theme of the system', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/events' }, { fixture: 'events.json' });
    useTheme('dark');
    cy.viewport(1280, 1040);

    cy.visit('/');

    cy.findByRole('list', { name: 'Upcoming events' }).findAllByRole('listitem').should('exist');
    cy.findByText('82 seats left of 120').should('be.visible');
    cy.get('body').should('have.css', 'background-color').and('equal', 'rgb(11, 17, 34)');
    cy.screenshot('readme-home-dark', { capture: 'viewport', overwrite: true });
  });

  it('shows the not-found page for an unknown address', () => {
    cy.visit('/nowhere', { failOnStatusCode: false });

    cy.findByRole('heading', { level: 1, name: 'Page not found' }).should('be.visible');
  });
});
