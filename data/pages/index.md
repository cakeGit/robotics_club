# Welcome to Robotics Club Documentation

This is the main documentation page for our robotics club projects and
tutorials.

## Navigation

Use the sidebar to navigate through different sections of the documentation.

## About

The Robotics Club is dedicated to building cool robots, exploring engineering
and programming.

```scratch
when [up arrow v] key pressed::event
motor [C v] turn this way for (100) seconds

when [down arrow v] key pressed::event
motor [D v] turn that way for (100) seconds

when [up arrow v] key pressed::event
motor [D v] turn this way for (100) seconds

when [down arrow v] key pressed::event
motor [C v] turn that way for (100) seconds

when [left arrow v] key pressed::event
motor [C v] turn that way for (100) seconds

when [right arrow v] key pressed::event
motor [C v] turn this way for (100) seconds

when [left arrow v] key pressed::event
motor [D v] turn this way for (100) seconds

when [right arrow v] key pressed::event
motor [D v] turn that way for (100) seconds
```

```scratch
when @greenFlag clicked
motor [A v] set power (100) %
motor [B v] set power (100) %
motor [C v] set power (100) %
motor [D v] set power (100) %
forever
    if <<<not <key [up arrow v] pressed?>> and <not <key [down arrow v] pressed?>>> and <<not <key [right arrow v] pressed?>> and <not <key [left arrow v] pressed?>>>> then
        motor [C v] turn that way for (0) seconds
        motor [D v] turn that way for (0) seconds
        stop [other scripts in sprite v]
    end
end
```
