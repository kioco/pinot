/**
 * Handles the 'alert details' route.
 * @module manage/alert/route
 * @exports manage alert model
 */
import RSVP from 'rsvp';
import fetch from 'fetch';
import moment from 'moment';
import { isPresent } from "@ember/utils";
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { checkStatus, buildDateEod } from 'thirdeye-frontend/utils/utils';

// Setup for query param behavior
const queryParamsConfig = {
  refreshModel: true,
  replace: true
};

export default Route.extend({
  queryParams: {
    jobId: queryParamsConfig
  },

  durationCache: service('services/duration'),

  beforeModel(transition) {
    const id = transition.params['manage.alert'].alert_id;
    const { jobId, functionName } = transition.queryParams;
    const duration = '3m';
    const startDate = buildDateEod(3, 'month').valueOf();
    const endDate = moment().utc().valueOf();

    // Enter default 'explore' route with defaults loaded in URI
    // An alert Id of 0 means there is an alert creation error to display
    if (transition.targetName === 'manage.alert.index' && Number(id) !== -1) {
      this.transitionTo('manage.alert.explore', id, { queryParams: {
        duration,
        startDate,
        endDate,
        functionName: null,
        jobId
      }});

      // Save duration to service object for session availability
      this.get('durationCache').setDuration({ duration, startDate, endDate });
    }
  },

  model(params, transition) {
    const { alert_id: id, jobId, functionName } = params;
    if (!id) { return; }

    // Fetch all the basic alert data needed in manage.alert subroutes
    // Apply calls from go/te-ss-alert-flow-api
    return RSVP.hash({
      id,
      jobId,
      functionName: functionName || 'Unknown',
      isLoadError: Number(id) === -1,
      destination: transition.targetName,
      alertData: fetch(`/onboard/function/${id}`).then(checkStatus),
      email: fetch(`/thirdeye/email/function/${id}`).then(checkStatus),
      allConfigGroups: fetch('/thirdeye/entity/ALERT_CONFIG').then(res => res.json()),
      allAppNames: fetch('/thirdeye/entity/APPLICATION').then(res => res.json())
    });
  },

  resetController(controller, isExiting) {
    this._super(...arguments);
    if (isExiting) {
      controller.set('alertData', {});
    }
  },

  setupController(controller, model) {
    this._super(controller, model);

    const {
      id,
      alertData,
      pathInfo,
      jobId,
      isLoadError,
      functionName,
      destination,
      allConfigGroups
    } = model;

    const newAlertData = !alertData ? {} : alertData;
    let errorText = '';

    // Itereate through config groups to enhance all alerts with extra properties (group name, application)
    allConfigGroups.forEach((config) => {
      let groupFunctionIds = config.emailConfig && config.emailConfig.functionIds ? config.emailConfig.functionIds : [];
      let foundMatch = groupFunctionIds.find(funcId => funcId === Number(id));
      if (foundMatch) {
        Object.assign(newAlertData, {
          application: config.application,
          group: config.name
        });
      }
    });

    const isEditModeActive = destination.includes('edit') || destination.includes('tune');
    const pattern = newAlertData.alertFilter ? newAlertData.alertFilter.pattern : 'N/A';
    const granularity = newAlertData.bucketSize && newAlertData.bucketUnit ? `${newAlertData.bucketSize}_${newAlertData.bucketUnit}` : 'N/A';
    Object.assign(newAlertData, { pattern, granularity });

    // We do not have a valid alertId. Set error state.
    if (isLoadError) {
      Object.assign(newAlertData, { functionName, isActive: false });
      errorText = `${functionName.toUpperCase()} has failed to create. Please try again or email ask_thirdeye@linkedin.com`;
    }

    controller.setProperties({
      id,
      pathInfo,
      errorText,
      isLoadError,
      isEditModeActive,
      alertData: newAlertData,
      isTransitionDone: true,
      isOverViewModeActive: !isEditModeActive,
      isReplayPending: isPresent(jobId)
    });
  },

  actions: {
    /**
     * Set loader on start of transition
     */
    willTransition(transition) {
      this.controller.set('isTransitionDone', false);
      if (transition.targetName === 'manage.alert.index') {
        this.refresh();
      }
    },

    /**
     * Once transition is complete, remove loader
     */
    didTransition() {
      this.controller.set('isTransitionDone', true);
    },

    /**
     * Toggle button modes and handle transition for edit
     */
    transitionToEditPage(alertId) {
      this.controller.setProperties({
        isOverViewModeActive: false,
        isEditModeActive: true
      });
      this.transitionTo('manage.alert.edit', alertId);
    },

    /**
     * Toggle button modes and handle transition for Alert Page (overview)
     * Persist query params as much as possible
     */
    transitionToAlertPage(alertId) {
      const tuneModel = this.modelFor('manage.alert.tune');
      this.controller.setProperties({
        isOverViewModeActive: true,
        isEditModeActive: false
      });
      if (tuneModel && tuneModel.duration === 'custom') {
        const { id, duration, startDate, endDate } = tuneModel;
        this.transitionTo('manage.alert.explore', id, { queryParams: { duration, startDate, endDate }});
      } else {
        this.transitionTo('manage.alert', alertId);
      }
    },

    /**
     * Toggle button modes and handle transition for tuning page
     * Persist query params as much as possible
     */
    transitionToTunePage(alertId) {
      const exploreModel = this.modelFor('manage.alert.explore');
      this.controller.setProperties({
        isOverViewModeActive: false,
        isEditModeActive: true
      });
      if (exploreModel && exploreModel.duration === 'custom') {
        const { id, duration, startDate, endDate } = exploreModel;
        this.transitionTo('manage.alert.tune', id, { queryParams: { duration, startDate, endDate }});
      } else {
        this.transitionTo('manage.alert.tune', alertId);
      }
    },

    // Sub-route errors will bubble up to this
    error(error, transition) {
      this.controller.set('isLoadError', true);
    }
  }

});
