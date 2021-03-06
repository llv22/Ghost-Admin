/* jshint expr:true */
import EmberObject from '@ember/object';
import NavItem from 'ghost-admin/models/navigation-item';
import {assert, expect} from 'chai';
import {describe, it} from 'mocha';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-mocha';

// const navSettingJSON = `[
//     {"label":"Home","url":"/"},
//     {"label":"JS Test","url":"javascript:alert('hello');"},
//     {"label":"About","url":"/about"},
//     {"label":"Sub Folder","url":"/blah/blah"},
//     {"label":"Telephone","url":"tel:01234-567890"},
//     {"label":"Mailto","url":"mailto:test@example.com"},
//     {"label":"External","url":"https://example.com/testing?query=test#anchor"},
//     {"label":"No Protocol","url":"//example.com"}
// ]`;

describe('Unit: Controller: settings/design', function () {
    setupTest('controller:settings/design', {
        // Specify the other units that are required for this test.
        needs: [
            'model:navigation-item',
            'service:ajax',
            'service:config',
            'service:ghostPaths',
            'service:notifications',
            'service:session',
            'service:upgrade-status'
        ]
    });

    it('blogUrl: captures config and ensures trailing slash', function () {
        let ctrl = this.subject();
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        expect(ctrl.get('blogUrl')).to.equal('http://localhost:2368/blog/');
    });

    it('init: creates a new navigation item', function () {
        let ctrl = this.subject();

        run(() => {
            expect(ctrl.get('newNavItem')).to.exist;
            expect(ctrl.get('newNavItem.isNew')).to.be.true;
        });
    });

    it('blogUrl: captures config and ensures trailing slash', function () {
        let ctrl = this.subject();
        ctrl.set('config.blogUrl', 'http://localhost:2368/blog');
        expect(ctrl.get('blogUrl')).to.equal('http://localhost:2368/blog/');
    });

    it('save: validates nav items', function (done) {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: [
                NavItem.create({label: 'First',   url: '/'}),
                NavItem.create({label: '',        url: '/second'}),
                NavItem.create({label: 'Third',   url: ''})
            ]}));
            // blank item won't get added because the last item is incomplete
            expect(ctrl.get('model.navigation.length')).to.equal(3);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
                done();
            }).catch(function failedValidation() {
                let navItems = ctrl.get('model.navigation');
                expect(navItems[0].get('errors').toArray()).to.be.empty;
                expect(navItems[1].get('errors.firstObject.attribute')).to.equal('label');
                expect(navItems[2].get('errors.firstObject.attribute')).to.equal('url');
                done();
            });
        });
    });

    it('save: ignores blank last item when saving', function (done) {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: [
                NavItem.create({label: 'First',   url: '/'}),
                NavItem.create({label: '',        url: ''})
            ]}));

            expect(ctrl.get('model.navigation.length')).to.equal(2);

            ctrl.get('save').perform().then(function passedValidation() {
                assert(false, 'navigationItems weren\'t validated on save');
                done();
            }).catch(function failedValidation() {
                let navItems = ctrl.get('model.navigation');
                expect(navItems[0].get('errors').toArray()).to.be.empty;
                done();
            });
        });
    });

    it('action - addNavItem: adds item to navigationItems', function () {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: [
                NavItem.create({label: 'First', url: '/first', last: true})
            ]}));
        });

        expect(ctrl.get('model.navigation.length')).to.equal(1);

        ctrl.set('newNavItem.label', 'New');
        ctrl.set('newNavItem.url', '/new');

        run(() => {
            ctrl.send('addNavItem');
        });

        expect(ctrl.get('model.navigation.length')).to.equal(2);
        expect(ctrl.get('model.navigation.lastObject.label')).to.equal('New');
        expect(ctrl.get('model.navigation.lastObject.url')).to.equal('/new');
        expect(ctrl.get('model.navigation.lastObject.isNew')).to.be.false;
        expect(ctrl.get('newNavItem.label')).to.be.blank;
        expect(ctrl.get('newNavItem.url')).to.be.blank;
        expect(ctrl.get('newNavItem.isNew')).to.be.true;
    });

    it('action - addNavItem: doesn\'t insert new item if last object is incomplete', function () {
        let ctrl = this.subject();

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: [
                NavItem.create({label: '', url: '', last: true})
            ]}));
            expect(ctrl.get('model.navigation.length')).to.equal(1);
            ctrl.send('addNavItem');
            expect(ctrl.get('model.navigation.length')).to.equal(1);
        });
    });

    it('action - deleteNavItem: removes item from navigationItems', function () {
        let ctrl = this.subject();
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: navItems}));
            expect(ctrl.get('model.navigation').mapBy('label')).to.deep.equal(['First', 'Second']);
            ctrl.send('deleteNavItem', ctrl.get('model.navigation.firstObject'));
            expect(ctrl.get('model.navigation').mapBy('label')).to.deep.equal(['Second']);
        });
    });

    it('action - reorderItems: updates navigationItems list', function () {
        let ctrl = this.subject();
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: navItems}));
            expect(ctrl.get('model.navigation').mapBy('label')).to.deep.equal(['First', 'Second']);
            ctrl.send('reorderItems', navItems.reverseObjects());
            expect(ctrl.get('model.navigation').mapBy('label')).to.deep.equal(['Second', 'First']);
        });
    });

    it('action - updateUrl: updates URL on navigationItem', function () {
        let ctrl = this.subject();
        let navItems = [
            NavItem.create({label: 'First', url: '/first'}),
            NavItem.create({label: 'Second', url: '/second', last: true})
        ];

        run(() => {
            ctrl.set('model', EmberObject.create({navigation: navItems}));
            expect(ctrl.get('model.navigation').mapBy('url')).to.deep.equal(['/first', '/second']);
            ctrl.send('updateUrl', '/new', ctrl.get('model.navigation.firstObject'));
            expect(ctrl.get('model.navigation').mapBy('url')).to.deep.equal(['/new', '/second']);
        });
    });
});
