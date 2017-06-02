import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isNull, map, property } from 'lodash';

import { Grid, Row, Col, Nav, Navbar, NavItem, FormGroup,  Label, Glyphicon, Tabs, Tab } from 'react-bootstrap';

import CubeSelector from './components/CubeSelector';
import DrillDownMenu from './components/DrillDownMenu';
import CutMenu from './components/CutMenu';
import DataTable from './components/DataTable';
import MeasuresSelector from './components/MeasuresSelector';
import ChartContainer from './components/ChartContainer';
import DebugModal from './components/DebugModal';
import CutModal from './components/CutModal';
import ErrorAlert from './components/ErrorAlert';

import { removeDrilldown, removeCut, cutExpression } from './redux/reducers/aggregation';
import { showModal } from './redux/reducers/modal';
import { showCutModal } from './redux/reducers/cutModal';

import './css/App.css';

function serializeAggregationParams(aggregation) {

    const s = {};

    if (aggregation.drillDowns.length > 0) {
        s.drillDowns = map(aggregation.drillDowns, (dd) => [dd.hierarchy.dimension.name, dd.hierarchy.name, dd.name]);
    }

    if (Object.keys(aggregation.cuts).length > 0) {
        s.cuts = map(aggregation.cuts, (v, k) => cutExpression(v));
    }

    if (Object.keys(aggregation.measures).length > 0) {
        s.measures = map(aggregation.measures, property('name'));
    }

    return s;
};

function parseAggregationParams(params) {

    let p;

    try {
        p = JSON.parse(params);
    }
    catch (e) {
        return null;
    }
}

class App extends Component {

    hashChange() {
        console.log('HASH CHANGE', window.location);
    }

    componentDidMount() {
        window.addEventListener("hashchange", this.hashChange, false);
    }

    componentWillUnmount() {
        window.removeEventListener("hashchange", this.hashChange, false);
    }

    render() {

        const { drillDowns, cuts, loading } = this.props.aggregation;

        if (this.props.currentCube) {
            console.log(
                'SERIAL',
                { cube: this.props.currentCube.name,
                  ...serializeAggregationParams(this.props.aggregation) }
            );
        }

        return (
            <div className="App">
                <DebugModal />
                <CutModal />
                <Navbar>
                    <Navbar.Header>
                        <Navbar.Brand>
                            mondrian-rest
                        </Navbar.Brand>
                        <Navbar.Toggle />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        <Nav>
                            <Navbar.Form pullLeft>
                                <FormGroup>
                                    <CubeSelector />
                                </FormGroup>
                                {' '}
                            </Navbar.Form>
                        </Nav>
                        <Nav pullRight>
                            <NavItem disabled={this.props.loading || isNull(this.props.currentCube)} eventKey={1} href="#" onClick={() => this.props.dispatch(showModal())}>Debug</NavItem>
                        </Nav>
                    </Navbar.Collapse>
                </Navbar>
                <div className="container" style={{position: 'relative'}}>
                    <div className="loading-overlay" style={{visibility: this.props.loading ? 'visible' : 'hidden' }}>
                        <div className="loader" />
                    </div>
                    <Grid>
                        <Row md={12}>
                            <ErrorAlert />
                        </Row>
                        <Row style={{paddingTop: '5px', paddingBottom: '5px'}}>
                            <Col md={1}>
                                Drilldowns:
                            </Col>
                            <Col md={11}>
                                <DrillDownMenu disabled={loading} drillDowns={drillDowns} cube={this.props.currentCube} />
                                {drillDowns.map((dd, i) =>
                                    <Label className="pill"
                                           bsStyle="primary"
                                           key={i}>{dd.hierarchy.dimension.name} / {dd.name}<Glyphicon className="remove" glyph="remove" style={{top: '2px', marginLeft: '5px'}} onClick={() => this.props.dispatch(removeDrilldown(dd))} /></Label>
                                 )}
                            </Col>
                        </Row>
                        <Row style={{paddingTop: '5px', paddingBottom: '5px'}}>
                            <Col md={1}>
                                Cuts:
                            </Col>
                            <Col md={11}>
                                <CutMenu disabled={this.props.loading} cube={this.props.currentCube} />
                                {map(cuts, (cut, level, i) =>
                                    <Label className="pill"
                                           bsStyle="primary"
                                           key={level}
                                           onClick={() => this.props.dispatch(showCutModal(cut.level))}>
                                        {cut.level.hierarchy.dimension.name} / {cut.level.name}{ cut.cutMembers.length > 1 ? `(${cut.cutMembers.length})` : `: ${cut.cutMembers[0].caption}` }<Glyphicon className="remove" glyph="remove" style={{top: '2px', marginLeft: '5px'}} onClick={(e) => { this.props.dispatch(removeCut(cut.level)); e.stopPropagation(); }} /></Label>
                                 )}
                            </Col>
                        </Row>
                        <Row style={{paddingTop: '5px', paddingBottom: '5px'}}>
                            <Col md={1}>
                                Measures:
                            </Col>
                            <Col md={11}>
                                <MeasuresSelector />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Tabs defaultActiveKey={1} id="tabs" animation={false}>
                                    <Tab eventKey={1} title="Data">
                                        <DataTable />
                                    </Tab>
                                    <Tab eventKey={2} title="Chart"><ChartContainer /></Tab>
                                </Tabs>
                            </Col>
                        </Row>
                    </Grid>
                </div>
            </div>
        );
    }
}

const ConnectedApp = connect((state) => (
    {
        currentCube: state.cubes.currentCube,
        aggregation: state.aggregation.present
    }
))(App);

export default ConnectedApp;
