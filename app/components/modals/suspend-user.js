import ModalComponent from 'ghost-admin/components/modals/base';
import {alias} from '@ember/object/computed';
import {invokeAction} from 'ember-invoke-action';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({

    user: alias('model'),

    suspendUser: task(function* () {
        try {
            yield invokeAction(this, 'confirm');
        } finally {
            this.send('closeModal');
        }
    }).drop(),

    actions: {
        confirm() {
            return this.get('suspendUser').perform();
        }
    }
});
