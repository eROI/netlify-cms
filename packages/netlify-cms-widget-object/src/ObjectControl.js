import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css, cx } from 'react-emotion';
import { Map, List } from 'immutable';
import { ObjectWidgetTopBar, components } from 'netlify-cms-ui-default';

const styles = {
  nestedObjectControl: css`
    padding: 6px 14px 14px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  `,
};

export default class ObjectControl extends Component {
  componentValidate = {};

  objectUniqueFieldIds = [];

  static propTypes = {
    onChangeObject: PropTypes.func.isRequired,
    onValidateObject: PropTypes.func.isRequired,
    onDeleteErrors: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.bool]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
    editorControl: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    fieldsErrors: ImmutablePropTypes.map.isRequired,
  };

  static defaultProps = {
    value: Map(),
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
    };
  }

  /*
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
  }

  processControlRef = (field, wrappedControl) => {
    if (!wrappedControl) return;
    const name = field.get('name');
    const list = field.get('widget') == 'list';
    const object = field.get('widget') == 'object';
    if (list) {
      this.componentValidate[name] = wrappedControl.innerWrappedControl.validateList;
    } else if (object) {
      this.componentValidate[name] = wrappedControl.innerWrappedControl.validateObject;
    } else {
      this.componentValidate[name] = wrappedControl.validate;
    }
    this.objectUniqueFieldIds.push(wrappedControl.props.uniqueFieldId);
  };

  validateObject = () => {
    const { field } = this.props;
    let fields = field.get('field') || field.get('fields');
    fields = List.isList(fields) ? fields : List([fields]);
    fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
  };

  controlFor(field, key) {
    const {
      value,
      onChangeObject,
      onValidateObject,
      onDeleteErrors,
      fieldsErrors,
      editorControl: EditorControl,
    } = this.props;

    if (field.get('widget') === 'hidden') {
      return null;
    }
    const fieldName = field.get('name');
    const fieldValue = value && Map.isMap(value) ? value.get(fieldName) : value;

    return (
      <EditorControl
        key={key}
        field={field}
        value={fieldValue}
        onChange={onChangeObject}
        onDeleteErrors={onDeleteErrors}
        fieldsErrors={fieldsErrors}
        onValidate={onValidateObject}
        processControlRef={this.processControlRef}
      />
    );
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  renderFields = (multiFields, singleField) => {
    if (multiFields) {
      return multiFields.map((f, idx) => this.controlFor(f, idx));
    }
    return this.controlFor(singleField);
  };

  render() {
    const { field, forID, classNameWrapper, forList } = this.props;
    const { collapsed } = this.state;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields || singleField) {
      return (
        <div
          id={forID}
          className={cx(classNameWrapper, components.objectWidgetTopBarContainer, {
            [styles.nestedObjectControl]: forList,
          })}
        >
          {forList ? null : (
            <ObjectWidgetTopBar
              collapsed={collapsed}
              onCollapseToggle={this.handleCollapseToggle}
            />
          )}
          {collapsed ? null : this.renderFields(multiFields, singleField)}
        </div>
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
