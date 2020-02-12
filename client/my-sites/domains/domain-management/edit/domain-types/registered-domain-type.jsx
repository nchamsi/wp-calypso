/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { Card } from '@automattic/components';
import VerticalNav from 'components/vertical-nav';
import { recordTracksEvent, recordGoogleEvent } from 'state/analytics/actions';
import { withLocalizedMoment } from 'components/localized-moment';
import DomainStatus from '../card/domain-status';
import VerticalNavItem from 'components/vertical-nav/item';
import { emailManagement } from 'my-sites/email/paths';
import {
	domainManagementContactsPrivacy,
	domainManagementNameServers,
	domainManagementTransfer,
} from 'my-sites/domains/paths';
import IcannVerificationCard from 'my-sites/domains/domain-management/components/icann-verification';
import { isRecentlyRegistered } from 'lib/domains/utils';
import { DOMAINS } from 'lib/url/support';

import CompactFormToggle from 'components/forms/form-toggle/compact';

class RegisteredDomainType extends React.Component {
	getVerticalNavigation() {
		const { expiry, expired, pendingTransfer } = this.props.domain;
		const { moment } = this.props;
		const inNormalState = ! pendingTransfer && ! expired;
		const inGracePeriod = moment().subtract( 18, 'days' ) <= moment( expiry );

		return (
			<VerticalNav>
				{ inNormalState && this.emailNavItem() }
				{ ( inNormalState || inGracePeriod ) && this.nameServersNavItem() }
				{ ( inNormalState || inGracePeriod ) && this.contactsPrivacyNavItem() }
				{ ( ! expired || inGracePeriod ) && this.transferNavItem() }
			</VerticalNav>
		);
	}

	emailNavItem() {
		const path = emailManagement( this.props.selectedSite.slug, this.props.domain.name );

		return <VerticalNavItem path={ path }>{ this.props.translate( 'Email' ) }</VerticalNavItem>;
	}

	nameServersNavItem() {
		const path = domainManagementNameServers(
			this.props.selectedSite.slug,
			this.props.domain.name
		);

		return (
			<VerticalNavItem path={ path }>
				{ this.props.translate( 'Name Servers and DNS' ) }
			</VerticalNavItem>
		);
	}

	contactsPrivacyNavItem() {
		const { translate } = this.props;
		const path = domainManagementContactsPrivacy(
			this.props.selectedSite.slug,
			this.props.domain.name
		);

		return <VerticalNavItem path={ path }>{ translate( 'Contacts and Privacy' ) }</VerticalNavItem>;
	}

	transferNavItem() {
		const path = domainManagementTransfer( this.props.selectedSite.slug, this.props.domain.name );

		return (
			<VerticalNavItem path={ path }>{ this.props.translate( 'Transfer Domain' ) }</VerticalNavItem>
		);
	}

	resolveStatus() {
		const { domain, translate } = this.props;
		const { registrationDate } = domain;

		if ( domain.isPendingIcannVerification && domain.currentUserCanManage ) {
			return {
				statusText: translate( 'Action required' ),
				statusClass: 'status-pending',
				icon: 'info',
			};
		}

		const recentlyRegistered = isRecentlyRegistered( registrationDate );

		if ( recentlyRegistered ) {
			return {
				statusText: translate( 'Activating' ),
				statusClass: 'status-pending',
				icon: 'cloud_upload',
			};
		}

		return {
			statusText: translate( 'Active' ),
			statusClass: 'status-success',
			icon: 'check_circle',
		};
	}

	renderRecentlyRegistered() {
		const { domain, translate } = this.props;
		const { registrationDate, name: domain_name } = domain;
		const domainsLink = <a href={ DOMAINS } target="_blank" rel="noopener noreferrer" />;

		const recentlyRegistered = isRecentlyRegistered( registrationDate );

		if ( ! recentlyRegistered ) {
			return null;
		}

		return (
			<div>
				{ translate(
					'We are setting up %(domain)s for you. It should start working immediately but may be unreliable in the first 2 hours. {{domainsLink}}Learn more{{/domainsLink}}',
					{
						args: {
							domain: domain_name,
						},
						components: {
							domainsLink,
						},
					}
				) }
			</div>
		);
	}

	render() {
		const { domain, moment } = this.props;
		const { name: domain_name } = domain;

		const { statusText, statusClass, icon } = this.resolveStatus();

		return (
			<div className="domain-types__container">
				<DomainStatus
					header={ domain_name }
					statusText={ statusText }
					statusClass={ statusClass }
					icon={ icon }
				>
					{ domain.isPendingIcannVerification && domain.currentUserCanManage && (
						<IcannVerificationCard
							selectedDomainName={ domain.name }
							selectedSiteSlug={ this.props.selectedSite.slug }
							explanationContext="new-status"
							compact={ true }
						/>
					) }
					{ this.renderRecentlyRegistered() }
				</DomainStatus>
				<Card compact={ true }>Expires: { moment( domain.expiry ).format( 'LL' ) }</Card>
				<Card compact={ true }>
					Auto Renew (on) <CompactFormToggle checked={ true } />
				</Card>
				{ this.getVerticalNavigation() }
			</div>
		);
	}
}

export default connect( null, { recordTracksEvent, recordGoogleEvent } )(
	withLocalizedMoment( localize( RegisteredDomainType ) )
);
