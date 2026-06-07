import re

with open("Frontend/src/components/CodeChallengeBlock.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Strip comments to avoid false matches
code = re.sub(r"//.*", "", code)
code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)

# Strip curly brace expressions, but be careful of nested ones
# We can do a character scan to find JSX tags and match them
stack = []
i = 0
n = len(code)

while i < n:
    if code[i] == '<':
        # Check if comment or closing tag or opening tag
        if i + 1 < n and code[i+1] == '/':
            # Closing tag
            end = code.find('>', i)
            tag_content = code[i+2:end].strip()
            tag_name = tag_content.split()[0]
            tag_name = tag_name.replace(">", "")
            
            # Find line number
            line_num = code.count('\n', 0, i) + 1
            print(f"Line {line_num}: Closing </{tag_name}>")
            
            if stack:
                last_tag, last_line = stack.pop()
                if last_tag != tag_name:
                    print(f"ERROR: Mismatch at line {line_num}: </{tag_name}> closes <{last_tag}> from line {last_line}")
                    # Put back on stack
                    stack.append((last_tag, last_line))
            else:
                print(f"ERROR: Closing </{tag_name}> at line {line_num} but stack is empty!")
            i = end + 1
        elif i + 1 < n and code[i+1] == '!':
            # XML Comment/CDATA
            i += 2
        else:
            # Opening tag
            end = code.find('>', i)
            # Find if self-closing
            is_self = False
            if code[end-1] == '/':
                is_self = True
                tag_content = code[i+1:end-1].strip()
            else:
                tag_content = code[i+1:end].strip()
                
            if not tag_content:
                # Fragment <>
                tag_name = ""
            else:
                tag_name = tag_content.split()[0]
                
            line_num = code.count('\n', 0, i) + 1
            
            # Check if this is a valid tag (not a comparison like i < n or generic expression)
            # A valid JSX tag name starts with a letter or capital letter
            if re.match(r"^[a-zA-Z0-9\._\-:]+$", tag_name):
                if is_self:
                    print(f"Line {line_num}: Self-closing <{tag_name}/>")
                else:
                    print(f"Line {line_num}: Opening <{tag_name}>")
                    stack.append((tag_name, line_num))
            i = end + 1
    elif code[i] == '{':
        # Skip JS expressions
        # Skip until matching '}'
        brace_count = 1
        i += 1
        while i < n and brace_count > 0:
            if code[i] == '{':
                brace_count += 1
            elif code[i] == '}':
                brace_count -= 1
            i += 1
    else:
        i += 1

print("\n--- Remaining on Stack ---")
for tag_name, line_num in stack:
    print(f"Line {line_num}: Unclosed <{tag_name}>")
