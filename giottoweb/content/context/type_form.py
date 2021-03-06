from lux import forms


class TypeForm(forms.Form):
    '''Form for the Trianglify page'''
    type = forms.ChoiceField(options=('svg', 'canvas'))

    layout = forms.Layout(showLabels=False)


def template():
    return TypeForm().layout.as_form()